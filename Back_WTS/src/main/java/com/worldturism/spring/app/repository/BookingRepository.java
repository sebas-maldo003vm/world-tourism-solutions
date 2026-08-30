package com.worldturism.spring.app.repository;

import com.worldturism.spring.app.model.Booking;
import com.worldturism.spring.app.model.BookingStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Booking> findByProviderBusiness_User_IdOrderByCreatedAtDesc(Long userId);

    java.util.Optional<Booking> findByIdAndProviderBusiness_User_Id(Long id, Long userId);

    boolean existsByUserIdAndProviderBusinessIdAndStatus(Long userId, Long businessId, BookingStatus status);

    // Para el itinerario: reservas aprobadas o pendientes, ordenadas por fecha y hora de inicio
    List<Booking> findByUserIdAndStatusInOrderByBookingDateAscStartTimeAsc(
            Long userId, List<BookingStatus> statuses);
}