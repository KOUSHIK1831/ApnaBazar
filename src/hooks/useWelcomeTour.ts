import { useRef } from 'react';
import { driver, type Driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useAuth } from './useAuth';
import type { Tab } from '@/pages/Dashboard';

const STORAGE_KEY = 'apnabazar-tour-completed';

export function useWelcomeTour(setActiveTab?: (tab: Tab) => void) {
  const { user } = useAuth();
  const driverObj = useRef<Driver | null>(null);

  const startTour = () => {
    // 1. Remove tour for admin
    if (user?.role === 'admin') return;

    driverObj.current = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      steps: [
        {
          element: '#tour-welcome',
          popover: {
            title: 'Welcome to ApnaBazar!',
            description: 'Let us show you around your seller dashboard. Everything you need to manage your store is right here.',
            side: 'center',
            align: 'center',
          },
        },
        {
          element: '[data-tour="products"]',
          popover: {
            title: 'Product Catalog',
            description: 'View and manage all your listed products here. You can edit details, update stock, or remove items.',
            side: 'bottom',
          },
          onHighlighted: () => {
            setActiveTab?.('products');
          }
        },
        {
          element: '[data-tour="orders"]',
          popover: {
            title: 'Manage Orders',
            description: 'Track and process customer orders. Keep your buyers happy with timely updates!',
            side: 'bottom',
          },
          onHighlighted: () => {
            setActiveTab?.('orders');
          }
        },
        {
          element: '[data-tour="upload"]',
          popover: {
            title: 'AI Upload',
            description: 'Upload product photos here. Our AI will automatically extract titles, prices, and categories for you.',
            side: 'bottom',
          },
          onHighlighted: () => {
            setActiveTab?.('upload');
          }
        },
        {
          element: '[data-tour="inventory"]',
          popover: {
            title: 'Stock Management',
            description: 'Monitor your inventory levels and get alerts when items are running low.',
            side: 'bottom',
          },
          onHighlighted: () => {
            setActiveTab?.('inventory');
          }
        },
        {
          element: '[data-tour="settings"]',
          popover: {
            title: 'Store Settings',
            description: 'Customize your store name, description, contact details, and theme.',
            side: 'bottom',
          },
          onHighlighted: () => {
            setActiveTab?.('settings');
          }
        },
        {
          element: '#tour-feedback',
          popover: {
            title: 'Share Feedback',
            description: 'Have a suggestion or found a bug? Let us know! Your feedback helps us improve ApnaBazar.',
            side: 'bottom',
          },
        },
        {
          element: '#tour-language',
          popover: {
            title: 'Language Preferences',
            description: 'ApnaBazar is available in multiple languages. You can switch between English, Telugu, and Hindi at any time.',
            side: 'bottom',
          },
        },
      ],
      onDestroyed: () => {
        localStorage.setItem(STORAGE_KEY, 'true');
      },
    });

    // Slight delay to ensure DOM is ready
    setTimeout(() => {
      driverObj.current?.drive();
    }, 500);
  };

  const isTourCompleted = () => {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  };

  return { startTour, isTourCompleted };
}
