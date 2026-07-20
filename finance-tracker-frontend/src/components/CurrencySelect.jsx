import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CURRENCIES } from '../api/currencies.js';

export default function CurrencySelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = CURRENCIES.find((c) => c.code === value) || CURRENCIES[0];

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div className="currency-select" ref={ref}>
      <button
        type="button"
        className="currency-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="currency-symbol">{selected.symbol}</span>
        <span className="currency-code">{selected.code}</span>
        <span className={`currency-caret ${open ? 'up' : ''}`}>▾</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            className="currency-list"
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
          >
            {CURRENCIES.map((c) => (
              <li key={c.code}>
                <button
                  type="button"
                  className={`currency-option ${c.code === value ? 'selected' : ''}`}
                  onClick={() => {
                    onChange(c.code);
                    setOpen(false);
                  }}
                  role="option"
                  aria-selected={c.code === value}
                >
                  <span className="currency-symbol">{c.symbol}</span>
                  <span className="currency-code">{c.code}</span>
                  <span className="currency-name">{c.label}</span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
