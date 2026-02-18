import { motion } from 'framer-motion';
import { Loader2, ScanFace, ShieldCheck } from 'lucide-react';

interface AIProcessingOverlayProps {
  title: string;
  subtitle: string;
  icon?: 'scan' | 'shield' | 'loading';
}

const icons = {
  scan: ScanFace,
  shield: ShieldCheck,
  loading: Loader2,
};

const AIProcessingOverlay = ({ title, subtitle, icon = 'loading' }: AIProcessingOverlayProps) => {
  const Icon = icons[icon];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-12"
    >
      <div className="relative mb-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="w-24 h-24 rounded-full border-4 border-accent border-t-transparent"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="w-8 h-8 text-accent" />
        </div>
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 rounded-full border-2 border-accent/30"
        />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
      <div className="flex gap-1 mt-4">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            animate={{ y: [-3, 3, -3] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
            className="w-2 h-2 rounded-full bg-accent"
          />
        ))}
      </div>
    </motion.div>
  );
};

export default AIProcessingOverlay;
