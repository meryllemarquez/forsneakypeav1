# Stage 1: Build the JAR file using Maven with Java 21
FROM maven:3.9.8-eclipse-temurin-21 AS build
WORKDIR /app

COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Run the Java app with Java 21 JRE
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Class Data Sharing (AppCDS): unpack the Spring Boot jar, then do a "training run" that
# loads the whole application context and dumps every loaded class into application.jsa.
# At runtime the JVM maps that archive instead of parsing/verifying thousands of classes,
# which cuts startup time. The training run happens in THIS stage (same JDK that runs the
# app) because an archive is only valid for the exact JVM that created it.
#
# There is no database during `docker build`, so the training run is told not to touch one:
# Flyway off, no schema validation, no JDBC metadata lookup, and Hikari allowed to start
# without a connection. If training fails for any reason the build still succeeds and the
# app simply starts without the archive (the JVM ignores a missing -XX:SharedArchiveFile).
RUN java -Djarmode=tools -jar app.jar extract --destination /app/extracted \
    && rm app.jar \
    && ( DB_URL=jdbc:postgresql://localhost:5432/cds DB_USERNAME=cds DB_PASSWORD=cds \
         MASTER_PASSWORD=cds JWT_SECRET=cds-training-run-only-cds-training-run-only-cds-training-run-only \
         java -XX:ArchiveClassesAtExit=/app/extracted/application.jsa \
              -Dspring.context.exit=onRefresh \
              -Dspring.flyway.enabled=false \
              -Dspring.jpa.hibernate.ddl-auto=none \
              -Dspring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect \
              -Dspring.jpa.properties.hibernate.boot.allow_jdbc_metadata_access=false \
              -Dspring.datasource.hikari.initialization-fail-timeout=-1 \
              -jar /app/extracted/app.jar \
         || echo "CDS training run failed; continuing without an AppCDS archive" )

EXPOSE 8080
# JVM flags (aimed at a small, CPU-starved container such as Render's free tier):
#  -XX:TieredStopAtLevel=1   C1 compiler only: faster warm-up, less compile CPU (peak speed is lower, fine here)
#  -XX:+UseSerialGC          single-threaded GC, smallest footprint on a fraction of a CPU
#  -XX:MaxRAMPercentage=60   caps the heap as a share of the container's memory limit (not the host's),
#                            leaving room for metaspace/threads so the platform doesn't OOM-kill the container
#  -XX:SharedArchiveFile     the AppCDS archive built above
ENTRYPOINT ["java", "-XX:TieredStopAtLevel=1", "-XX:+UseSerialGC", "-XX:MaxRAMPercentage=60", "-XX:SharedArchiveFile=/app/extracted/application.jsa", "-jar", "/app/extracted/app.jar"]
