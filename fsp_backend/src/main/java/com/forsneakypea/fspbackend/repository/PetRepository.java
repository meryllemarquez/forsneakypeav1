package com.forsneakypea.fspbackend.repository;

import com.forsneakypea.fspbackend.entity.Pet;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PetRepository extends JpaRepository<Pet, String> {
    List<Pet> findAllByOrderBySortOrderAsc();

    // Row lock so two simultaneous taps both count instead of overwriting each other.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Pet p where p.id = :id")
    Optional<Pet> findForUpdate(@Param("id") String id);
}
