'use client';

import { useEffect } from 'react';

export function NetlifyBadgeRemover() {
  useEffect(() => {
    const purgeNetlifyElements = () => {
      const selectors = [
        '#netlify-badge',
        '.netlify-badge',
        'netlify-drawer',
        '#netlify-drawer',
        '[data-netlify-badge]',
      ];

      selectors.forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => {
          el.remove();
        });
      });

      // Remover botões ou spans com texto 'Powered by Netlify'
      document.querySelectorAll('button, div, a, span').forEach((el) => {
        if (el.textContent?.trim().toLowerCase().includes('powered by netlify')) {
          el.remove();
        }
      });
    };

    purgeNetlifyElements();

    const observer = new MutationObserver(() => {
      purgeNetlifyElements();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
