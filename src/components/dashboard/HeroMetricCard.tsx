'use client';

import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface HeroMetricCardProps {
  title: string;
  value: number;
  maxValue?: number;
  trend?: number;
  trendLabel?: string;
  icon: LucideIcon;
  color?: 'primary' | 'warning' | 'success' | 'danger';
  className?: string;
  onClick?: () => void;
}

const colorVariants = {
  primary: {
    progress: 'text-purple-600 dark:text-purple-400',
    background: 'stroke-purple-100 dark:stroke-purple-900/30',
    icon: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20',
    trend: {
      positive: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
      negative: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20'
    }
  },
  warning: {
    progress: 'text-yellow-600 dark:text-yellow-400',
    background: 'stroke-yellow-100 dark:stroke-yellow-900/30',
    icon: 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20',
    trend: {
      positive: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
      negative: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20'
    }
  },
  success: {
    progress: 'text-green-600 dark:text-green-400',
    background: 'stroke-green-100 dark:stroke-green-900/30',
    icon: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
    trend: {
      positive: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
      negative: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20'
    }
  },
  danger: {
    progress: 'text-red-600 dark:text-red-400',
    background: 'stroke-red-100 dark:stroke-red-900/30',
    icon: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
    trend: {
      positive: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
      negative: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20'
    }
  }
};

export const HeroMetricCard: React.FC<HeroMetricCardProps> = ({
  title,
  value,
  maxValue = 100,
  trend,
  trendLabel = 'vs last week',
  icon: Icon,
  color = 'primary',
  className,
  onClick
}) => {
  const percentage = Math.min((value / maxValue) * 100, 100);
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  const colors = colorVariants[color];
  const TrendIcon = trend && trend > 0 ? TrendingUp : TrendingDown;
  const trendColors = trend && trend > 0 ? colors.trend.positive : colors.trend.negative;

  return (
    <Card 
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-primary/10 border-border/50',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={cn('p-2 rounded-lg', colors.icon)}>
            <Icon className="h-5 w-5" />
          </div>
          {trend !== undefined && (
            <div className={cn('flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium', trendColors)}>
              <TrendIcon className="h-3 w-3" />
              <span>{Math.abs(trend).toFixed(1)}%</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-6">
          {/* Circular Progress */}
          <div className="relative flex-shrink-0">
            <svg className="w-32 h-32 transform -rotate-90 drop-shadow-sm" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className={colors.background}
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className={cn('transition-all duration-1000 ease-out', colors.progress)}
              />
            </svg>
            {/* Center content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                {/* Subtle background circle for better readability */}
                <div className="absolute inset-4 bg-background/90 backdrop-blur-sm rounded-full border border-border/30 shadow-sm" />
                <div className="relative z-10">
                  <div className="text-2xl font-bold text-foreground">
                    {typeof value === 'number' && value % 1 !== 0 
                      ? value.toFixed(1) 
                      : Math.round(value)}
                  </div>
                  {maxValue !== 100 && (
                    <div className="text-xs text-muted-foreground font-medium">
                      / {maxValue}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {title}
            </h3>
            {trend !== undefined && (
              <p className="text-sm text-muted-foreground">
                <span className={cn('font-medium', trend > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                  {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                </span>
                {' '}
                <span className="text-muted-foreground">{trendLabel}</span>
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};