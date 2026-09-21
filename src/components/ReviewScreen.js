import React, { useState } from 'react';
import { useLang } from '../contexts/LanguageContext';
import { Icon } from './Icon';
import './ReviewScreen.css';

export default function ReviewScreen({ bookingInfo, userId, onDone }) {
  const { t } = useLang();
  const [rating,  setRating]  = useState(0);
  const [hover,   setHover]   = useState(0);
  const [comment, setComment] = useState('');
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = () => {
    if (!rating) return;
    const review = {
      id: bookingInfo?.reservationId || bookingInfo?.id || `review-${Date.now()}`,
      rating,
      comment:     comment.trim(),
      destination: typeof bookingInfo?.destination === 'string'
        ? bookingInfo.destination
        : bookingInfo?.destination?.name,
      departure:   bookingInfo?.departure,
      passengers:  bookingInfo?.passengers,
      total:       bookingInfo?.total,
      timestamp:   new Date().toISOString(),
    };
    try {
      const key = `duruon-reviews:${userId || 'guest'}`;
      const stored = JSON.parse(localStorage.getItem(key) || '[]');
      const reviews = Array.isArray(stored) ? stored : [];
      const nextReviews = [...reviews.filter((item) => item.id !== review.id), review];
      localStorage.setItem(key, JSON.stringify(nextReviews));
      onDone();
    } catch {
      setSubmitError('리뷰를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    }
  };

  const display = hover || rating;

  return (
    <div className="review-screen">
      <div className="review-card">
        {/* 상단 아이콘 */}
        <div className="review-icon-wrap">
          <Icon name="bus" size={32} color="#35C8B4" />
        </div>

        <h2 className="review-title">{t.reviewTitle}</h2>
        <p className="review-sub">{t.reviewSub}</p>

        {/* 목적지 뱃지 */}
        {bookingInfo?.destination?.name && (
          <div className="review-dest-badge">
            <Icon name="mapPin" size={13} color="#35C8B4" />
            {bookingInfo.destination.name}
          </div>
        )}

        {/* 별점 */}
        <div className="star-row">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              className="star-btn"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              aria-label={`${n}점`}
            >
              <Icon
                name="star"
                size={40}
                color={n <= display ? '#f5c518' : '#e0e8e6'}
              />
            </button>
          ))}
        </div>

        {/* 코멘트 */}
        <textarea
          className="review-comment"
          placeholder={t.commentPlaceholder}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={200}
        />

        {/* 제출 */}
        <button
          className={`review-submit ${rating === 0 ? 'disabled' : ''}`}
          onClick={handleSubmit}
          disabled={rating === 0}
        >
          {t.submitReview}
        </button>
        {submitError && <p className="review-error" role="alert">{submitError}</p>}

        <button className="review-skip" onClick={onDone}>
          {t.skipReview}
        </button>
      </div>
    </div>
  );
}
