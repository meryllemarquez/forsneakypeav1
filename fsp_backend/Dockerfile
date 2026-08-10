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
EXPOSE 8080
# -XX:MaxRAMPercentage caps the JVM heap as a share of the container's memory
# limit instead of the JVM's historical default (1/4 of the *host's* physical
# RAM, which on a constrained/free-tier container can wildly overshoot the
# container's actual limit and get it OOM-killed by the platform).
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]