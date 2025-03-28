import * as React from "react";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center"
    >
      {theme === "light" ? (
        <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="48" height="48" rx="24" fill="#1C1C1C"/>
          <circle cx="23.5" cy="24" r="8.5" fill="#FFBC04" stroke="white" strokeWidth="2"/>
          <rect x="23" y="35.5" width="2" height="3" rx="1" fill="white"/>
          <rect x="23" y="9.5" width="2" height="3" rx="1" fill="white"/>
          <rect x="35" y="25" width="2" height="3" rx="1" transform="rotate(-90 35 25)" fill="white"/>
          <rect x="9" y="24.5" width="2" height="3" rx="1" transform="rotate(-90 9 24.5)" fill="white"/>
          <rect x="13.4143" y="35.0355" width="2" height="3" rx="1" transform="rotate(-135 13.4143 35.0355)" fill="white"/>
          <rect x="34.5356" y="33.6213" width="2" height="3" rx="1" transform="rotate(135 34.5356 33.6213)" fill="white"/>
          <rect x="16.5356" y="14.6213" width="2" height="3" rx="1" transform="rotate(135 16.5356 14.6213)" fill="white"/>
          <rect x="33.4143" y="16.0355" width="2" height="3" rx="1" transform="rotate(-135 33.4143 16.0355)" fill="white"/>
        </svg>
      ) : (
        <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="48" height="48" rx="24" fill="white"/>
          <path d="M33.0657 30.2943C34.139 30.5996 35.2735 30.9222 36.474 31.2831C35.454 32.784 34.1181 34.0873 32.5382 35.1098C30.5967 36.3664 28.3489 37.1587 25.9938 37.4118C23.6386 37.665 21.254 37.3707 19.0527 36.5568C16.8516 35.7429 14.9059 34.4363 13.3845 32.7586C11.8634 31.0812 10.8131 29.0847 10.3199 26.9479C9.82691 24.8115 9.90459 22.5947 10.5468 20.492C11.1892 18.3889 12.3782 16.4594 14.0154 14.8775C15.3632 13.575 16.9803 12.5417 18.7677 11.8391C18.8344 12.7177 18.882 13.5509 18.9279 14.3522C18.939 14.547 18.95 14.7399 18.9612 14.931C19.0393 16.2672 19.1246 17.5307 19.3069 18.722C19.6772 21.1428 20.453 23.2973 22.3804 25.3905C23.8944 27.0772 26.0077 28.075 28.5265 28.9292C29.7942 29.3591 31.2008 29.7636 32.723 30.1968C32.8365 30.2292 32.9507 30.2616 33.0657 30.2943Z" fill="#CCCCCC" stroke="black" strokeWidth="2"/>
          <path d="M34.3245 15.5297L34.6842 19.1154L37.8546 19.4179L34.9065 19.7484L34.3245 22.995L33.7426 19.7484L30.7944 19.4179L33.9649 19.1154L34.3245 15.5297Z" fill="black"/>
          <path d="M30.6411 9.5L30.8757 11.8445L32.9433 12.0423L31.0206 12.2584L30.6411 14.3812L30.2616 12.2584L28.3389 12.0423L30.4065 11.8445L30.6411 9.5Z" fill="black"/>
        </svg>
      )}
    </button>
  );
}
