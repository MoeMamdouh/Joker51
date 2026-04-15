import React, { useRef, useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  SharedValue,
} from 'react-native-reanimated';
import { runOnJS } from 'react-native-worklets';
import { useTranslation } from 'react-i18next';
import { CardTile } from './CardTile';
import { SegmentedControl } from '../ui/SegmentedControl';
import { colors, spacing, shadows, zIndex } from '../../theme/tokens';
import { Card } from '../../engine/types';
import { useDirection } from '../../contexts/DirectionContext';
import { useHandOrder } from '../../hooks/useHandOrder';

const CARD_WIDTH = 52 + spacing.xs; // md card width + gap
const LONG_PRESS_DURATION = 200;

// How many px from the left/right edge triggers auto-scroll
const EDGE_ZONE = 72;
// Maximum scroll speed in px per frame (16ms)
const MAX_SCROLL_SPEED = 14;

const GAP_SPRING = { damping: 28, stiffness: 400 };

// Auto-dismiss new card indicator after this many ms
const NEW_CARD_INDICATOR_TIMEOUT_MS = 3000;

interface HandAreaProps {
  cards: Card[];
  /** The active player's ID — used to detect turn handoffs and preserve sort mode. */
  playerId?: string;
  selectedCards: Card[];
  /** Staged cards are dimmed — they're committed to a meld preview. */
  stagedCards?: readonly Card[];
  onCardPress(card: Card): void;
}

interface DraggableCardProps {
  card: Card;
  index: number;
  totalCards: number;
  selected: boolean;
  dimmed: boolean;
  isNew: boolean;
  activeIndex: SharedValue<number>;
  dragTranslateX: SharedValue<number>;
  onPress(): void;
  onDragActivate(): void;
  onDragSettle(): void;
  onMoveCard(from: number, to: number): void;
  /** Called every gesture frame with the absolute screen X of the pointer */
  onPointerMove(absoluteX: number): void;
  testID?: string;
}

function DraggableCard({
  card,
  index,
  totalCards,
  selected,
  dimmed,
  isNew,
  activeIndex,
  dragTranslateX,
  onPress,
  onDragActivate,
  onDragSettle,
  onMoveCard,
  onPointerMove,
  testID,
}: DraggableCardProps) {
  const startIndex = useSharedValue(0);

  const pan = Gesture.Pan()
    .activateAfterLongPress(LONG_PRESS_DURATION)
    .enabled(!dimmed)
    .onStart(() => {
      activeIndex.value = index;
      startIndex.value = index;
      dragTranslateX.value = 0;
      runOnJS(onDragActivate)();
    })
    .onUpdate((e) => {
      dragTranslateX.value = e.translationX;
      // Forward absolute pointer X to JS thread for edge-scroll calculation
      runOnJS(onPointerMove)(e.absoluteX);
    })
    .onEnd((e) => {
      const toIdx = Math.round(startIndex.value + e.translationX / CARD_WIDTH);
      runOnJS(onMoveCard)(startIndex.value, toIdx);
    })
    .onFinalize(() => {
      activeIndex.value = -1;
      dragTranslateX.value = withSpring(0, GAP_SPRING);
      runOnJS(onDragSettle)();
    });

  const animatedStyle = useAnimatedStyle(() => {
    const isActive = activeIndex.value === index;

    if (isActive) {
      return {
        transform: [
          { translateX: dragTranslateX.value },
          { translateY: withTiming(-16, { duration: 120 }) },
          { scale: withTiming(1.1, { duration: 120 }) },
        ],
        zIndex: zIndex.cardDragging,
        ...shadows.cardLifted,
      };
    }

    // Gap animation — spring cards aside to show the drop target
    let shiftX = 0;
    if (activeIndex.value >= 0) {
      const from = activeIndex.value;
      const insertAt = Math.max(
        0,
        Math.min(
          Math.round(from + dragTranslateX.value / CARD_WIDTH),
          totalCards - 1
        )
      );

      if (from < insertAt && index > from && index <= insertAt) {
        shiftX = -CARD_WIDTH; // dragging right → neighbours slide left
      } else if (from > insertAt && index >= insertAt && index < from) {
        shiftX = CARD_WIDTH;  // dragging left  → neighbours slide right
      }
    }

    return {
      transform: [
        { translateX: withSpring(shiftX, GAP_SPRING) },
        { translateY: withSpring(0, GAP_SPRING) },
        { scale: withSpring(1, GAP_SPRING) },
      ],
      zIndex: zIndex.card,
    };
  });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={animatedStyle}>
        <CardTile
          card={card}
          selected={selected}
          dimmed={dimmed}
          isNew={isNew}
          size="md"
          onPress={onPress}
          testID={testID}
        />
      </Animated.View>
    </GestureDetector>
  );
}

export function HandArea({ cards, playerId, selectedCards, stagedCards, onCardPress }: HandAreaProps) {
  const { t } = useTranslation();
  const { isRTL } = useDirection();
  const { orderedCards, moveCard, sortBySuit, sortByRank, sortMode, newCard, clearNewCard } =
    useHandOrder(cards, playerId);

  const [isDragging, setIsDragging] = useState(false);

  // Shared values — all DraggableCard worklets read these cooperatively
  const activeIndex = useSharedValue(-1);
  const dragTranslateX = useSharedValue(0);

  // --- Auto-scroll refs (JS-thread only, no re-render needed) ---
  const scrollViewRef = useRef<ScrollView>(null);
  const containerRef = useRef<View>(null);
  // Absolute screen bounds of the hand container, measured when drag starts
  const containerBoundsRef = useRef({ left: 0, right: 300 });
  // Current scroll offset — updated by onScroll so we always know where we are
  const currentScrollXRef = useRef(0);
  // Absolute screen X of the drag pointer, updated every gesture frame
  const pointerAbsXRef = useRef(0);
  // The setInterval handle for the auto-scroll loop
  const autoScrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // New card indicator auto-dismiss timer
  const newCardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll to start so the new card (prepended at index 0) is immediately visible
  useEffect(() => {
    if (newCard !== null) {
      scrollViewRef.current?.scrollTo({ x: 0, animated: true });
    }
  }, [newCard]);

  // Auto-dismiss new card indicator after NEW_CARD_INDICATOR_TIMEOUT_MS
  useEffect(() => {
    if (newCardTimerRef.current) {
      clearTimeout(newCardTimerRef.current);
      newCardTimerRef.current = null;
    }
    if (newCard !== null) {
      newCardTimerRef.current = setTimeout(() => {
        clearNewCard();
        newCardTimerRef.current = null;
      }, NEW_CARD_INDICATOR_TIMEOUT_MS);
    }
    return () => {
      if (newCardTimerRef.current) {
        clearTimeout(newCardTimerRef.current);
        newCardTimerRef.current = null;
      }
    };
  }, [newCard, clearNewCard]);

  // Suppress new card indicator when the card is staged
  useEffect(() => {
    if (newCard !== null && stagedCards?.includes(newCard)) {
      clearNewCard();
    }
  }, [stagedCards, newCard, clearNewCard]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (autoScrollIntervalRef.current) clearInterval(autoScrollIntervalRef.current);
    };
  }, []);

  if (orderedCards.length === 0) {
    return <View style={styles.empty} />;
  }

  const displayCards = isRTL ? [...orderedCards].reverse() : orderedCards;

  function handleMoveCard(fromIndex: number, toIndex: number) {
    const clampedTo = Math.max(0, Math.min(toIndex, displayCards.length - 1));
    if (isRTL) {
      moveCard(displayCards.length - 1 - fromIndex, displayCards.length - 1 - clampedTo);
    } else {
      moveCard(fromIndex, clampedTo);
    }
  }

  function handlePointerMove(absoluteX: number) {
    pointerAbsXRef.current = absoluteX;
  }

  function startAutoScroll() {
    setIsDragging(true);

    // Measure absolute screen position of the container right now
    containerRef.current?.measure((_x, _y, width, _height, pageX) => {
      containerBoundsRef.current = { left: pageX, right: pageX + width };
    });

    if (autoScrollIntervalRef.current) clearInterval(autoScrollIntervalRef.current);

    autoScrollIntervalRef.current = setInterval(() => {
      const { left, right } = containerBoundsRef.current;
      const absX = pointerAbsXRef.current;
      const relX = absX - left;          // X relative to container left edge
      const containerWidth = right - left;

      let speed = 0;
      if (relX > 0 && relX < EDGE_ZONE) {
        // Near left edge — scroll left, faster the closer to the edge
        speed = -MAX_SCROLL_SPEED * (1 - relX / EDGE_ZONE);
      } else if (relX > containerWidth - EDGE_ZONE && relX < containerWidth) {
        // Near right edge — scroll right
        speed = MAX_SCROLL_SPEED * (1 - (containerWidth - relX) / EDGE_ZONE);
      }

      if (Math.abs(speed) > 0.5) {
        const newX = Math.max(0, currentScrollXRef.current + speed);
        scrollViewRef.current?.scrollTo({ x: newX, animated: false });
        currentScrollXRef.current = newX;
      }
    }, 16);
  }

  function stopAutoScroll() {
    setIsDragging(false);
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
  }

  const sortDisabled = isDragging || (stagedCards?.length ?? 0) > 0;

  return (
    <GestureHandlerRootView style={styles.rootView}>
      <View style={[styles.toolbar, isRTL && styles.toolbarRTL]}>
        <SegmentedControl
          options={[
            { label: t('game.actions.sortBySuit'), value: 'bySuit' },
            { label: t('game.actions.sortByRank'), value: 'byRank' },
          ]}
          value={sortMode}
          onChange={(v) => (v === 'bySuit' ? sortBySuit() : sortByRank())}
          disabled={sortDisabled}
          testID="sort-mode-control"
        />
      </View>
      <View ref={containerRef} style={styles.rootView}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.content}
          scrollEnabled={!isDragging}
          onScroll={(e) => {
            currentScrollXRef.current = e.nativeEvent.contentOffset.x;
          }}
          scrollEventThrottle={16}
        >
          {displayCards.map((card, index) => {
            const isDimmed = stagedCards?.includes(card) ?? false;
            const isNewCard = card === newCard && !isDimmed;
            return (
              <DraggableCard
                key={`${card.rank}-${card.suit}-${card.isJoker}-${index}`}
                card={card}
                index={index}
                totalCards={displayCards.length}
                selected={selectedCards.includes(card)}
                dimmed={isDimmed}
                isNew={isNewCard}
                activeIndex={activeIndex}
                dragTranslateX={dragTranslateX}
                onPress={() => {
                  if (isNewCard) clearNewCard();
                  onCardPress(card);
                }}
                onDragActivate={startAutoScroll}
                onDragSettle={stopAutoScroll}
                onMoveCard={handleMoveCard}
                onPointerMove={handlePointerMove}
                testID={`hand-card-${index}`}
              />
            );
          })}
        </ScrollView>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  rootView: {
    width: '100%',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxs,
  },
  toolbarRTL: {
    justifyContent: 'flex-start',
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  empty: {
    height: 72,
    backgroundColor: colors.background,
  },
});
