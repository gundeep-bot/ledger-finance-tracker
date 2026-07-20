import { motion } from 'framer-motion';

export default function Card({ children, className = '', hover = true, style = {} }) {
  return (
    <motion.div
      className={`surface ${hover ? 'lift' : ''} card-pad ${className}`}
      style={style}
      whileHover={hover ? { y: -3 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
    >
      {children}
    </motion.div>
  );
}
