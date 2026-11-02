package com.worldturism.spring.app.infrastructure.persistence.repository;

import com.worldturism.spring.app.domain.model.Booking;
import com.worldturism.spring.app.domain.model.BookingStatus;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Booking> findByProviderBusiness_User_IdOrderByCreatedAtDesc(Long userId);

    java.util.Optional<Booking> findByIdAndProviderBusiness_User_Id(Long id, Long userId);

    boolean existsByUserIdAndProviderBusinessIdAndStatus(Long userId, Long businessId, BookingStatus status);

    // Itinerario completo: activas y completadas, ordenadas por fecha y hora de inicio.
    List<Booking> findByUserIdAndStatusInOrderByBookingDateAscStartTimeAsc(
            Long userId, List<BookingStatus> statuses);

    // Mismo conjunto, limitado a un día (incluye fechas pasadas).
    List<Booking> findByUserIdAndStatusInAndBookingDateOrderByStartTimeAsc(
            Long userId, List<BookingStatus> statuses, LocalDate bookingDate);
}