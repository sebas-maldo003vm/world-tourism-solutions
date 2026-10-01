package com.worldturism.spring.app.application.service;

import com.worldturism.spring.app.domain.model.AppUser;
import com.worldturism.spring.app.domain.model.Booking;
import com.worldturism.spring.app.domain.model.BookingStatus;
import com.worldturism.spring.app.domain.model.ProviderProfile;
import com.worldturism.spring.app.domain.model.Role;
import com.worldturism.spring.app.infrastructure.persistence.repository.BookingRepository;
import com.worldturism.spring.app.infrastructure.persistence.repository.ProviderProfileRepository;
import com.worldturism.spring.app.presentation.dto.BookingRequest;
import com.worldturism.spring.app.presentation.dto.BookingResponse;
import com.worldturism.spring.app.presentation.dto.ItineraryResponse;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ProviderProfileRepository providerProfileRepository;

    public BookingService(
            BookingRepository bookingRepository,
            ProviderProfileRepository providerProfileRepository) {
        this.bookingRepository = bookingRepository;
        this.providerProfileRepository = providerProfileRepository;
    }

    @Transactional
    public BookingResponse create(AppUser user, BookingRequest request) {
        validateUser(user);

        ProviderProfile business = providerProfileRepository.findById(request.businessId())
                .orElseThrow(() -> new IllegalArgumentException("El negocio no existe."));

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setProviderBusiness(business);
        booking.setBookingDate(request.bookingDate());
        booking.setStartTime(request.startTime());
        booking.setEndTime(request.endTime());
        booking.setNumPeople(request.numPeople());
        booking.setTotalPrice(
                requireBusinessPrice(business.getPrice())
                        .multiply(BigDecimal.valueOf(request.numPeople())));

        return BookingResponse.from(bookingRepository.save(booking));
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> listMyBookings(AppUser user) {
        validateUser(user);
        return bookingRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(BookingResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> listProviderBookings(AppUser user) {
        validateProvider(user);
        return bookingRepository.findByProviderBusiness_User_IdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(BookingResponse::from)
                .toList();
    }

    /**
     * Itinerario del usuario agrupado por ciudad (fecha y hora ascendente).
     * Incluye reservas activas y planes completados. Si {@code date} viene informado,
     * limita el resultado a ese día, también cuando es una fecha pasada.
     */
    @Transactional(readOnly = true)
    public List<ItineraryResponse> getItinerary(AppUser user, LocalDate date) {
        validateUser(user);

        List<BookingStatus> statuses = List.of(
                BookingStatus.PENDING, BookingStatus.APPROVED, BookingStatus.COMPLETED);

        List<Booking> bookings = date == null
                ? bookingRepository.findByUserIdAndStatusInOrderByBookingDateAscStartTimeAsc(
                        user.getId(), statuses)
                : bookingRepository.findByUserIdAndStatusInAndBookingDateOrderByStartTimeAsc(
                        user.getId(), statuses, date);

        Map<String, List<BookingResponse>> byCity = bookings.stream()
                .map(BookingResponse::from)
                .collect(Collectors.groupingBy(
                        b -> b.businessCity() != null && !b.businessCity().isBlank()
                                ? b.businessCity()
                                : "Sin ciudad",
                        LinkedHashMap::new,
                        Collectors.toList()));

        return byCity.entrySet().stream()
                .map(e -> new ItineraryResponse(e.getKey(), e.getValue()))
                .toList();
    }

    @Transactional
    public BookingResponse approve(AppUser user, Long bookingId) {
        return updateProviderBookingStatus(user, bookingId, BookingStatus.APPROVED);
    }

    @Transactional
    public BookingResponse reject(AppUser user, Long bookingId) {
        return updateProviderBookingStatus(user, bookingId, BookingStatus.REJECTED);
    }

    private BookingResponse updateProviderBookingStatus(AppUser user, Long bookingId, BookingStatus status) {
        validateProvider(user);

        Booking booking = bookingRepository.findByIdAndProviderBusiness_User_Id(bookingId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("La reserva no existe para este proveedor."));
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalArgumentException("Solo se pueden responder reservas pendientes.");
        }

        booking.setStatus(status);
        return BookingResponse.from(bookingRepository.save(booking));
    }

    private BigDecimal requireBusinessPrice(BigDecimal price) {
        if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("El negocio no tiene un precio válido configurado.");
        }
        return price;
    }

    private void validateUser(AppUser user) {
        if (user == null) throw new IllegalArgumentException("Usuario no autenticado.");
        if (user.getRole() != Role.USER)
            throw new IllegalArgumentException("Solo los usuarios pueden crear o consultar sus reservas.");
    }

    private void validateProvider(AppUser user) {
        if (user == null) throw new IllegalArgumentException("Usuario no autenticado.");
        if (user.getRole() != Role.PROVIDER)
            throw new IllegalArgumentException("Solo los proveedores pueden responder reservas.");
    }
}