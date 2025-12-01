import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}
interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}
interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className = '', ...props }: CardProps) {
  return <div className={`zynq-card ${className}`} {...props} />;
}

export function CardHeader({ className = '', ...props }: CardHeaderProps) {
  return <div className={`mb-2 ${className}`} {...props} />;
}

export function CardTitle({ className = '', ...props }: CardTitleProps) {
  return <h3 className={`font-medium ${className}`} {...props} />;
}

export function CardContent({ className = '', ...props }: CardContentProps) {
  return <div className={className} {...props} />;
}

export function CardFooter({ className = '', ...props }: CardFooterProps) {
  return <div className={`mt-3 ${className}`} {...props} />;
}
