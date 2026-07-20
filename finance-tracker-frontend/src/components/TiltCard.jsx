import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/**
 * Wraps children in a card that tilts toward the cursor in 3D and lifts
 * with a soft glow. Rotation is spring-damped so it settles smoothly
 * rather than snapping.
 */
export default function TiltCard({ children, className = '', style = {}, glow = true, maxTilt = 8 }) {
  const ref = useRef(null);

  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const springConfig = { stiffness: 150, damping: 18, mass: 0.6 };
  const rotateX = useSpring(useTransform(y, [0, 1], [maxTilt, -maxTilt]), springConfig);
  const rotateY = useSpring(useTransform(x, [0, 1], [-maxTilt, maxTilt]), springConfig);
  const glowX = useTransform(x, [0, 1], ['0%', '100%']);
  const glowY = useTransform(y, [0, 1], ['0%', '100%']);

  function handleMove(e) {
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width);
    y.set((e.clientY - rect.top) / rect.height);
  }

  function handleLeave() {
    x.set(0.5);
    y.set(0.5);
  }

  return (
    <motion.div
      ref={ref}
      className={`tilt-card ${className}`}
      style={{
        ...style,
        rotateX,
        rotateY,
        transformPerspective: 900,
      }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      whileHover={{ scale: 1.012 }}
      transition={{ scale: { type: 'spring', stiffness: 300, damping: 20 } }}
    >
      {glow && (
        <motion.div
          className="tilt-card-glow"
          style={{
            background: useTransform(
              [glowX, glowY],
              ([gx, gy]) => `radial-gradient(circle at ${gx} ${gy}, rgba(90,196,196,0.16), transparent 60%)`
            ),
          }}
        />
      )}
      <div className="tilt-card-content">{children}</div>
    </motion.div>
  );
}
