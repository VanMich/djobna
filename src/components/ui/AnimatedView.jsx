import React, { useEffect, useRef } from "react";
import { Animated } from "react-native";

/**
 * AnimatedView — wrapper avec animation d'entrée subtile (Uber/Yango style)
 *
 * Usage:
 *   <AnimatedView>…contenu qui fade-in…</AnimatedView>
 *   <AnimatedView slide="up" delay={100}>…slide up décalé…</AnimatedView>
 *   <AnimatedView slide="left" duration={400}>…slide left…</AnimatedView>
 *   <AnimatedView staggerIndex={2} staggerDelay={80}>…stagger list…</AnimatedView>
 *
 * Props:
 *   slide:        "up" | "down" | "left" | "right" | "none"  (default: "up")
 *   distance:     pixels du slide (default: 20)
 *   duration:     ms de l'animation (default: 350)
 *   delay:        ms avant le début (default: 0)
 *   staggerIndex: position dans une liste (multiplie le delay)
 *   staggerDelay: delay par item en stagger (default: 70ms)
 *   spring:       utiliser spring au lieu de timing (default: true)
 */
export default function AnimatedView({
  children,
  slide = "up",
  distance = 20,
  duration = 350,
  delay = 0,
  staggerIndex,
  staggerDelay = 70,
  spring = true,
  style,
}) {
  const anim = useRef(new Animated.Value(0)).current;

  const totalDelay =
    staggerIndex !== undefined
      ? delay + staggerIndex * staggerDelay
      : delay;

  useEffect(() => {
    const config = spring
      ? {
          toValue: 1,
          delay: totalDelay,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }
      : {
          toValue: 1,
          delay: totalDelay,
          duration,
          useNativeDriver: true,
        };

    const animation = spring
      ? Animated.spring(anim, config)
      : Animated.timing(anim, config);

    animation.start();

    return () => animation.stop();
  }, []);

  // Build transform array
  const opacity = anim;
  const transforms = [];

  if (slide !== "none") {
    const slideMap = {
      up: { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) },
      down: { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-distance, 0] }) },
      left: { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) },
      right: { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [-distance, 0] }) },
    };
    transforms.push(slideMap[slide] || slideMap.up);
  }

  return (
    <Animated.View
      style={[
        { opacity, transform: transforms.length > 0 ? transforms : undefined },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

/**
 * AnimatedList — helper pour animer une liste d'éléments avec stagger
 *
 * Usage:
 *   <AnimatedList>
 *     {items.map((item, i) => <AnimatedView key={i} staggerIndex={i}>…</AnimatedView>)}
 *   </AnimatedList>
 *
 * Ou plus simplement :
 *   <AnimatedList items={data} renderItem={(item, index) => <Card>…</Card>} />
 */
export function AnimatedList({
  items,
  renderItem,
  children,
  slide = "up",
  staggerDelay = 70,
  style,
}) {
  if (children) {
    return <Animated.View style={style}>{children}</Animated.View>;
  }

  return (
    <Animated.View style={style}>
      {items?.map((item, index) => (
        <AnimatedView
          key={item.id || index}
          slide={slide}
          staggerIndex={index}
          staggerDelay={staggerDelay}
        >
          {renderItem(item, index)}
        </AnimatedView>
      ))}
    </Animated.View>
  );
}
