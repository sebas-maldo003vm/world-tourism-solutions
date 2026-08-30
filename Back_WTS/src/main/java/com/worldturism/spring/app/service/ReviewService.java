package com.worldturism.spring.app.service;

import com.worldturism.spring.app.model.AppUser;
import com.worldturism.spring.app.model.BookingStatus;
import com.worldturism.spring.app.model.ProviderProfile;
import com.worldturism.spring.app.model.Review;
import com.worldturism.spring.app.model.Role;
import com.worldturism.spring.app.repository.BookingRepository;
import com.worldturism.spring.app.repository.ProviderProfileRepository;
import com.worldturism.spring.app.repository.ReviewRepository;
import com.worldturism.spring.app.view.dto.ReviewRequest;
import com.worldturism.spring.app.view.dto.ReviewResponse;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReviewService {

	private final ReviewRepository reviewRepository;
	private final ProviderProfileRepository providerProfileRepository;
	private final BookingRepository bookingRepository;

	public ReviewService(
			ReviewRepository reviewRepository,
			ProviderProfileRepository providerProfileRepository,
			BookingRepository bookingRepository) {
		this.reviewRepository = reviewRepository;
		this.providerProfileRepository = providerProfileRepository;
		this.bookingRepository = bookingRepository;
	}

	@Transactional
	public ReviewResponse create(AppUser user, ReviewRequest request) {
		validateUser(user);

		ProviderProfile business = providerProfileRepository.findById(request.businessId())
				.orElseThrow(() -> new IllegalArgumentException("El negocio no existe."));
		if (!bookingRepository.existsByUserIdAndProviderBusinessIdAndStatus(user.getId(), business.getId(), BookingStatus.APPROVED)) {
			throw new IllegalArgumentException("Debes tener una reserva aprobada antes de dejar una resena.");
		}
		if (reviewRepository.existsByUserIdAndProviderBusinessId(user.getId(), business.getId())) {
			throw new IllegalArgumentException("Ya dejaste una resena para este negocio.");
		}

		Review review = new Review();
		review.setUser(user);
		review.setProviderBusiness(business);
		review.setRating(request.rating());
		review.setComment(request.comment());

		updateBusinessRating(business, request.rating());
		return ReviewResponse.from(reviewRepository.save(review));
	}

	@Transactional(readOnly = true)
	public List<ReviewResponse> listByBusiness(Long businessId) {
		if (!providerProfileRepository.existsById(businessId)) {
			throw new IllegalArgumentException("El negocio no existe.");
		}

		return reviewRepository.findByProviderBusinessIdOrderByCreatedAtDesc(businessId)
				.stream()
				.map(ReviewResponse::from)
				.toList();
	}

	@Transactional(readOnly = true)
	public List<ReviewResponse> listMyReviews(AppUser user) {
		validateUser(user);

		return reviewRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
				.stream()
				.map(ReviewResponse::from)
				.toList();
	}

	private void updateBusinessRating(ProviderProfile business, Integer rating) {
		int currentTotal = business.getTotalReviews() == null ? 0 : business.getTotalReviews();
		float currentAverage = business.getAvgRating() == null ? 0.0f : business.getAvgRating();
		int newTotal = currentTotal + 1;
		float newAverage = ((currentAverage * currentTotal) + rating) / newTotal;

		business.setTotalReviews(newTotal);
		business.setAvgRating(newAverage);
	}

	private void validateUser(AppUser user) {
		if (user == null) {
			throw new IllegalArgumentException("Usuario no autenticado.");
		}
		if (user.getRole() != Role.USER) {
			throw new IllegalArgumentException("Solo los usuarios pueden dejar resenas.");
		}
	}
}
