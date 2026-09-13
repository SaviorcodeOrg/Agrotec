import { useState, useEffect } from 'react';

interface FadeInTextProps {
  text: string;
  delayMultiplier: number;
}

interface VisibleLetter {
  letter: string;
  id: number;
}

const FadeInText = ({ text, delayMultiplier }: FadeInTextProps) => {
  const [visibleLetters, setVisibleLetters] = useState<VisibleLetter[]>([]);

  useEffect(() => {
    const letters = text.split('');
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    letters.forEach((letter, index) => {
      const timeout = setTimeout(() => {
        setVisibleLetters(prev => [...prev, { letter, id: index }]);
      }, index * delayMultiplier);
      timeouts.push(timeout);
    });

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [text, delayMultiplier]);

  return (
    <div>
      {visibleLetters.map((item) => (
        <span key={item.id}>
          {item.letter}
        </span>
      ))}
    </div>
  );
};

export default FadeInText;