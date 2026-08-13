import React from 'react';

/**
 * 두루온 로고 — CSS filter로 흰색 반전 처리
 * height prop으로 크기 조절 (기본 40px)
 */
export default function DuruLogo({ height = 40, style = {} }) {
  return (
    <img
      src={`${process.env.PUBLIC_URL}/images/duru-logo.png`}
      alt="두루온"
      style={{
        height,
        width: 'auto',
        display: 'block',
        filter: 'brightness(0) invert(1)',
        ...style,
      }}
      draggable={false}
    />
  );
}
