import { motion } from 'framer-motion';

export default function AmbientBackground() {
  return (
    <div className="ambient-bg" aria-hidden="true">
      <motion.div
        className="blob blob-teal"
        animate={{ x: [0, 60, -20, 0], y: [0, -40, 30, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="blob blob-amber"
        animate={{ x: [0, -50, 40, 0], y: [0, 50, -30, 0] }}
        transition={{ duration: 32, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="blob blob-navy"
        animate={{ x: [0, 30, -60, 0], y: [0, -20, 20, 0] }}
        transition={{ duration: 38, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="ambient-grid" />
    </div>
  );
}
