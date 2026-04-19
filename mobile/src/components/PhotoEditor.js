import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  PanResponder,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Image } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { colors, spacing, typography, borderRadius } from '../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PREVIEW_HEIGHT = Math.min(SCREEN_HEIGHT * 0.45, 350);

/**
 * PhotoEditor modal — lets the user:
 *   1. Drag to set focal point (where thumbnails crop)
 *   2. Rotate the photo 90° left or right (baked into the file)
 *
 * Props:
 *   visible        — boolean
 *   photoUri       — full URL or local URI of the current photo
 *   initialPos     — { x: 50, y: 50 } percentages (0-100)
 *   onSave         — ({ uri, rotation, x, y }) => void
 *                    uri may be a new rotated URI if rotation was applied
 *   onCancel       — () => void
 */
export default function PhotoEditor({ visible, photoUri, initialPos, onSave, onCancel }) {
  const [pos, setPos] = useState(initialPos || { x: 50, y: 50 });
  const [rotation, setRotation] = useState(0); // cumulative degrees (0, 90, 180, 270)
  const [processing, setProcessing] = useState(false);

  const containerRef = useRef(null);
  const containerLayout = useRef(null);

  // Reset state when modal opens
  React.useEffect(() => {
    if (visible) {
      setPos(initialPos || { x: 50, y: 50 });
      setRotation(0);
      setProcessing(false);
    }
  }, [visible]);

  // ── Pan responder for drag-to-position ──────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        updatePosFromTouch(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
      },
      onPanResponderMove: (evt) => {
        updatePosFromTouch(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
      },
    })
  ).current;

  function updatePosFromTouch(pageX, pageY) {
    const layout = containerLayout.current;
    if (!layout) return;
    const relX = pageX - layout.x;
    const relY = pageY - layout.y;
    const x = Math.round(Math.max(0, Math.min(100, (relX / layout.width) * 100)));
    const y = Math.round(Math.max(0, Math.min(100, (relY / layout.height) * 100)));
    setPos({ x, y });
  }

  // ── Rotation ─────────────────────────────────────────────────────────────────
  function rotateLeft() {
    setRotation((r) => (r - 90 + 360) % 360);
  }

  function rotateRight() {
    setRotation((r) => (r + 90) % 360);
  }

  // ── Save ─────────────────────────────────────────────────────────────────────
  async function handleSave() {
    setProcessing(true);
    try {
      let finalUri = photoUri;

      if (rotation !== 0) {
        // Bake rotation into a new file
        const result = await ImageManipulator.manipulateAsync(
          photoUri,
          [{ rotate: rotation }],
          { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
        );
        finalUri = result.uri;
      }

      onSave({ uri: finalUri, rotated: rotation !== 0, x: pos.x, y: pos.y });
    } catch (err) {
      Alert.alert('Error', 'Could not process photo. Please try again.');
      setProcessing(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  if (!visible) return null;

  // The crosshair indicator shows where the focal point is
  const crosshairLeft = `${pos.x}%`;
  const crosshairTop = `${pos.y}%`;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onCancel}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Adjust Photo</Text>
          {processing ? (
            <ActivityIndicator color={colors.gold} style={styles.headerBtn} />
          ) : (
            <TouchableOpacity onPress={handleSave} style={styles.headerBtn}>
              <Text style={[styles.headerBtnText, styles.headerBtnSave]}>Save</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {/* Instructions */}
          <Text style={styles.instructionTitle}>Drag to set thumbnail focus</Text>
          <Text style={styles.instructionSub}>
            The crosshair marks where the thumbnail will be centered. The full photo is always shown when tapped.
          </Text>

          {/* Photo preview with draggable focal point */}
          <View
            style={styles.previewWrap}
            ref={containerRef}
            onLayout={(e) => {
              const { x, y, width, height } = e.nativeEvent.layout;
              // Measure absolute position on screen for touch calculation
              containerRef.current && containerRef.current.measure((fx, fy, w, h, px, py) => {
                containerLayout.current = { x: px, y: py, width: w, height: h };
              });
            }}
            {...panResponder.panHandlers}
          >
            <Image
              source={{ uri: photoUri }}
              style={[styles.previewImage, rotation !== 0 && { transform: [{ rotate: `${rotation}deg` }] }]}
              resizeMode="contain"
            />

            {/* Focal point crosshair */}
            <View style={[styles.crosshair, { left: crosshairLeft, top: crosshairTop }]} pointerEvents="none">
              <View style={styles.crosshairH} />
              <View style={styles.crosshairV} />
              <View style={styles.crosshairDot} />
            </View>

            {/* Thumbnail crop frame overlay */}
            <View style={styles.cropFrameWrap} pointerEvents="none">
              <View style={[styles.cropFrame, { left: crosshairLeft, top: crosshairTop }]} />
            </View>
          </View>

          {/* Position readout */}
          <Text style={styles.posReadout}>Focus: {pos.x}% × {pos.y}%</Text>

          {/* Rotation controls */}
          <View style={styles.rotSection}>
            <Text style={styles.rotTitle}>Rotate Photo</Text>
            <Text style={styles.rotSub}>Use this to fix sideways photos. The full-size photo will be re-saved rotated.</Text>
            <View style={styles.rotButtons}>
              <TouchableOpacity style={styles.rotBtn} onPress={rotateLeft} disabled={processing}>
                <Text style={styles.rotBtnIcon}>↺</Text>
                <Text style={styles.rotBtnLabel}>Rotate Left</Text>
              </TouchableOpacity>
              <View style={styles.rotDivider} />
              <TouchableOpacity style={styles.rotBtn} onPress={rotateRight} disabled={processing}>
                <Text style={styles.rotBtnIcon}>↻</Text>
                <Text style={styles.rotBtnLabel}>Rotate Right</Text>
              </TouchableOpacity>
            </View>
            {rotation !== 0 && (
              <Text style={styles.rotIndicator}>Rotated {rotation}°</Text>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  headerBtn: {
    minWidth: 60,
    alignItems: 'center',
  },
  headerBtnText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  headerBtnSave: {
    color: colors.gold,
    fontWeight: typography.weights.semibold,
  },
  body: {
    padding: spacing.md,
  },
  instructionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  instructionSub: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  previewWrap: {
    width: '100%',
    height: PREVIEW_HEIGHT,
    borderRadius: borderRadius.md,
    backgroundColor: colors.card,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: spacing.sm,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  crosshair: {
    position: 'absolute',
    width: 40,
    height: 40,
    marginLeft: -20,
    marginTop: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crosshairH: {
    position: 'absolute',
    width: 40,
    height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  crosshairV: {
    position: 'absolute',
    width: 1.5,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  crosshairDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gold,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  cropFrameWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cropFrame: {
    position: 'absolute',
    width: 80,
    height: 80,
    marginLeft: -40,
    marginTop: -40,
    borderWidth: 2,
    borderColor: colors.gold,
    borderRadius: 4,
    opacity: 0.7,
  },
  posReadout: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  rotSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.lg,
  },
  rotTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  rotSub: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  rotButtons: {
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  rotBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rotBtnIcon: {
    fontSize: 28,
    color: colors.gold,
    marginBottom: 2,
  },
  rotBtnLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  rotDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  rotIndicator: {
    textAlign: 'center',
    marginTop: spacing.sm,
    fontSize: typography.sizes.sm,
    color: colors.gold,
    fontWeight: typography.weights.medium,
  },
});
