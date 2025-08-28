import React, { useState, useEffect } from 'react';
import './NewsCarousel.css';

// 이미지 import - 변수명 중복 해결
import banner1 from '../../../assets/images/carousel/banner1.jpg';
import banner2 from '../../../assets/images/carousel/banner2.jpg';
import banner3 from '../../../assets/images/carousel/banner3.jpg';

const NewsCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const newsSlides = [
    {
      id: 1,
      image: banner1,
      alt: '배너 1'
    },
    {
      id: 2,
      image: banner2,
      alt: '배너 2'
    },
    {
      id: 3,
      image: banner3,
      alt: '배너 3'
    }
  ];

  useEffect(() => {
    const slideTimer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % newsSlides.length);
    }, 10000); // 5초에서 10초로 변경

    return () => clearInterval(slideTimer);
  }, [newsSlides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % newsSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + newsSlides.length) % newsSlides.length);
  };

  return (
    <div className="carousel-container">
      <div className="carousel-content">
        <button className="carousel-btn prev" onClick={prevSlide}>
          ‹
        </button>
        
        <div className="carousel-slide">
          <img 
            src={newsSlides[currentSlide].image} 
            alt={newsSlides[currentSlide].alt}
            className="carousel-image"
          />
        </div>
        
        <button className="carousel-btn next" onClick={nextSlide}>
          ›
        </button>
      </div>
      
      {/* 인디케이터 제거 - 주석 처리하거나 아예 삭제하세요
      <div className="carousel-indicators">
        {newsSlides.map((_, index) => (
          <button
            key={index}
            className={`indicator ${index === currentSlide ? 'active' : ''}`}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>
      */}
    </div>
  );
};

export default NewsCarousel;