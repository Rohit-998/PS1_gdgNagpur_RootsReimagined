'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './CarrierInsights.module.css';

const CARRIER_PERFORMANCE = [
  { name: 'Freightworld', completed: 2, total: 3, percentage: 66.67 },
  { name: 'Rapid Transport', completed: 13, total: 17, percentage: 76.47 },
  { name: 'PANDA SEALINE', completed: 1, total: 1, percentage: 100 },
];

const ON_TIME_PERFORMANCE = [
  { name: 'FTL Carrier for EWM', completed: 0, total: 2, percentage: 0 },
  { name: 'Road Carrier 1-Park Vista Blvd', completed: 0, total: 1, percentage: 0 },
  { name: 'Morgantown Road Reading', completed: 0, total: 1, percentage: 0 },
  { name: 'National Trucking', completed: 1, total: 2, percentage: 50 },
  { name: 'Freightworld', completed: 4, total: 7, percentage: 57.14 },
  { name: 'PGI Truck Lines', completed: 77, total: 133, percentage: 57.89 },
];

const TENDER_DATA = [
  { date: '20241221', positive: 5, negative: 1, completed: 5 },
  { date: '20241225', positive: 12, negative: 2, completed: 10 },
  { date: '20241228', positive: 35, negative: 4, completed: 35 },
  { date: '20250101', positive: 8, negative: 1, completed: 8 },
  { date: '20250105', positive: 18, negative: 2, completed: 15 },
  { date: '20250110', positive: 22, negative: 5, completed: 20 },
  { date: '20250115', positive: 14, negative: 2, completed: 14 },
  { date: '20250122', positive: 28, negative: 3, completed: 25 },
];

const COST_ANALYSIS = [
  { name: 'PGI Truck Lines', id: 'TMCR-R01 (PGI Truck...)', cost: '30.6K EUR' },
  { name: 'Atlantic Shipping Lines', id: 'TMCR-AT01 (Atlantic...)', cost: '30.6K EUR' },
  { name: 'Rapid Transport', id: 'TMCR-R10 (Rapid Tra...)', cost: '9.2K EUR' },
  { name: 'PANDA SEALINE', id: 'TMCR-S01 (PANDA SE...)', cost: '2.3K EUR' },
  { name: 'CHA Agent', id: 'TMCR-SP02 (CHA Age...)', cost: '1.5K EUR' },
];

export default function CarrierInsights() {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const cards = [
    /* 1. Carrier Performance */
    <div className={styles.insightCard} key="1">
      <div className={styles.cardHeader}>
        <div>
          <h3 className={styles.cardTitle}>Carrier Performance</h3>
          <p className={styles.cardSubtitle}>Execution Statistics</p>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.actionCount}>3</span>
          <MoreHorizontal size={16} className={styles.moreIcon} />
        </div>
      </div>
      <div className={styles.cardBodyScrollable}>
        {CARRIER_PERFORMANCE.map((carrier, idx) => (
          <div key={idx} className={styles.listItem}>
            <div className={styles.itemMeta}>
              <span className={styles.itemName}>{carrier.name}</span>
              <div className={styles.itemValues}>
                <span className={styles.itemFraction}>{carrier.completed}/{carrier.total}</span>
                <span className={styles.itemPercentage}>{carrier.percentage}</span>
              </div>
            </div>
            <div className={styles.progressBarBg}>
              <div 
                className={styles.progressBarFill} 
                style={{ width: `${carrier.percentage}%`, backgroundColor: '#455E70' }} 
              />
            </div>
          </div>
        ))}
      </div>
    </div>,

    /* 2. Carrier On Time Performance */
    <div className={styles.insightCard} key="2">
      <div className={styles.cardHeader}>
        <div>
          <h3 className={styles.cardTitle}>Carrier On Time Performance</h3>
          <p className={styles.cardSubtitle}>On Time Freight Orders</p>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.actionCount}>11</span>
          <MoreHorizontal size={16} className={styles.moreIcon} />
        </div>
      </div>
      <div className={styles.cardBodyScrollable}>
        {ON_TIME_PERFORMANCE.map((carrier, idx) => (
          <div key={idx} className={styles.listItem}>
            <div className={styles.itemMeta}>
              <span className={styles.itemName}>{carrier.name}</span>
              <div className={styles.itemValues}>
                <span className={styles.itemFraction}>{carrier.completed}/{carrier.total}</span>
                <span className={styles.itemPercentage}>{carrier.percentage}</span>
              </div>
            </div>
            <div className={styles.progressBarBg}>
              <div 
                className={styles.progressBarFill} 
                style={{ width: `${carrier.percentage}%`, backgroundColor: carrier.percentage > 0 ? '#455E70' : '#D1D5DB' }} 
              />
            </div>
          </div>
        ))}
      </div>
    </div>,

    /* 3. Tender Response Comparison */
    <div className={styles.insightCard} key="3">
      <div className={styles.cardHeader}>
        <div>
          <h3 className={styles.cardTitle}>Tender Response Comparison</h3>
          <div className={styles.largeValue}>334</div>
          <p className={styles.cardSubtitle}>No. of Positive Tend. Responses, No...</p>
        </div>
        <div className={styles.headerActions}>
          <MoreHorizontal size={16} className={styles.moreIcon} />
        </div>
      </div>
      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={TENDER_DATA} margin={{ top: 5, right: 10, left: 0, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="date" tick={{fontSize: 9}} tickMargin={5} angle={-45} textAnchor="end" height={40} axisLine={false} tickLine={false} />
            <YAxis tick={{fontSize: 9}} axisLine={false} tickLine={false} width={25} />
            <Tooltip wrapperStyle={{fontSize: '12px'}} />
            <Legend 
              wrapperStyle={{fontSize: '9px', marginTop: '10px'}} 
              iconType="square" 
              iconSize={6} 
              layout="vertical"
              verticalAlign="bottom"
              align="left"
            />
            <Line type="monotone" name="No. of Positive Tend. Responses" dataKey="positive" stroke="#3B82F6" strokeWidth={1.5} dot={{ r: 2 }} activeDot={{ r: 4 }} />
            <Line type="monotone" name="No. of Negative Tend. Responses" dataKey="negative" stroke="#F59E0B" strokeWidth={1.5} dot={{ r: 2 }} activeDot={{ r: 4 }} />
            <Line type="monotone" name="No. of Frt Orders with Completed Tend." dataKey="completed" stroke="#10B981" strokeWidth={1.5} dot={{ r: 2 }} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>,

    /* 4. Carrier Cost Analysis */
    <div className={styles.insightCard} key="4">
      <div className={styles.cardHeader}>
        <div>
          <h3 className={styles.cardTitle}>Carrier Cost Analysis</h3>
          <p className={styles.cardSubtitle}>Carriers with Highest Costs</p>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.actionCount}>6</span>
          <MoreHorizontal size={16} className={styles.moreIcon} />
        </div>
      </div>
      <div className={styles.cardBodyScrollable}>
        {COST_ANALYSIS.map((carrier, idx) => (
          <div key={idx} className={styles.costItem}>
            <div className={styles.costInfo}>
              <span className={styles.costName}>{carrier.name}</span>
              <span className={styles.costId}>{carrier.id}</span>
            </div>
            <div className={styles.costValueWrapper}>
              <span className={styles.costValue}>{carrier.cost}</span>
              <span className={styles.costCurrency}>(EUR)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  ];

  const nextSlide = () => setCurrentIndex((prev) => (prev === cards.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrentIndex((prev) => (prev === 0 ? cards.length - 1 : prev - 1));

  return (
    <div className={styles.insightsContainer}>
      <div className={styles.carouselWrapper}>
        {cards.map((card, index) => (
          <div 
            key={index} 
            className={`${styles.carouselSlide} ${index === currentIndex ? styles.activeSlide : ''}`}
            style={{ transform: `translateX(${100 * (index - currentIndex)}%)` }}
          >
            {card}
          </div>
        ))}
      </div>
      
      <button className={styles.carouselBtnPrev} onClick={prevSlide} aria-label="Previous Slide">
        <ChevronLeft size={16} />
      </button>
      <button className={styles.carouselBtnNext} onClick={nextSlide} aria-label="Next Slide">
        <ChevronRight size={16} />
      </button>

      <div className={styles.carouselDots}>
        {cards.map((_, i) => (
          <button 
            key={i} 
            className={`${styles.dot} ${i === currentIndex ? styles.activeDot : ''}`}
            onClick={() => setCurrentIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
