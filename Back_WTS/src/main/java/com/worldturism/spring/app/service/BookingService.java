package com.worldturism.spring.app.service;

import com.worldturism.spring.app.model.AppUser;
import com.worldturism.spring.app.model.Booking;
import com.worldturism.spring.app.model.BookingStatus;
import com.worldturism.spring.app.model.ProviderProfile;
import com.worldturism.spring.app.model.Role;
import com.worldturism.spring.app.repository.BookingRepository;
import com.worldturism.spring.app.repository.ProviderProfileRepository;
import com.worldturism.spring.app.view.dto.BookingRequest;
import com.worldturism.spring.app.view.dto.BookingResponse;
import com.worldturism.spring.app.view.dto.ItineraryResponse;
import java.math.BigDecimal;
import java.util.Comparator;
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
                parseBusinessPrice(business.getPrice())
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
     * Devuelve el itinerario del usuario agrupado por ciudad,
     * ordenado por fecha y hora de inicio (más cercano primero).
     */
    @Transactional(readOnly = true)
    public List<ItineraryResponse> getItinerary(AppUser user) {
        validateUser(user);

        List<BookingStatus> activeStatuses = List.of(
                BookingStatus.PENDING, BookingStatus.APPROVED);

        List<BookingResponse> bookings =
                bookingRepository.findByUserIdAndStatusInOrderByBookingDateAscStartTimeAsc(
                        user.getId(), activeStatuses)
                        .stream()
                        .map(BookingResponse::from)
                        .toList();

        // Agrupa por ciudad manteniendo el orden ya establecido (fecha+hora ASC)
        Map<String, List<BookingResponse>> byCity = bookings.stream()
                .collect(Collectors.groupingBy(
                        b -> b.businessCity() != null ? b.businessCity() : "Sin ciudad",
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

    private BigDecimal parseBusinessPrice(String price) {
        if (price == null || price.isBlank()) {
            throw new IllegalArgumentException("El negocio no tiene precio configurado.");
        }

        String normalizedPrice = price.trim().replace(" ", "");
        if (normalizedPrice.contains(",")) {
            normalizedPrice = normalizedPrice.replace(".", "").replace(",", ".");
        } else {
            int lastDotIndex = normalizedPrice.lastIndexOf(".");
            if (lastDotIndex >= 0 && normalizedPrice.length() - lastDotIndex - 1 == 3) {
                normalizedPrice = normalizedPrice.replace(".", "");
            }
        }

        try {
            BigDecimal parsedPrice = new BigDecimal(normalizedPrice);
            if (parsedPrice.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("El precio del negocio debe ser mayor a cero.");
            }
            return parsedPrice;
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException("El precio del negocio no tiene un formato valido.");
        }
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