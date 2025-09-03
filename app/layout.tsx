import React from 'react';
import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'Miami-Dade Housing Opportunities',
  description: 'Find affordable housing listings in Miami-Dade County.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
} 