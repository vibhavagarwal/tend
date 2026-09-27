import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import {
  activeHabits,
  attemptDataChange,
  archiveHabit,
  archivedHabits,
  createHabit,
  deleteHabitEntry,
  findDuplicate,
  restoreHabit,
  saveHabitEntry,
  validateEntryProposal,
} from "./src/domain/tend";
import { interpretHabitStatement } from "./src/domain/interpreter";
import { nextAcknowledgment } from "./src/domain/acknowledgment";
import { currentWeekRange, recentActivities, reflectionCounts } from "./src/domain/reflection";
import {
  emptyTendData,
  Habit,
  HabitEntry,
  InterpretationProposal,
  PendingStatement,
  TendData,
  ValidatedHabitEntry,
} from "./src/domain/types";
import { loadTendData, saveTendData } from "./src/persistence";
import { useTendSpeech } from "./src/voice/useTendSpeech";
import { Action, InlineSection, Rule, SectionLabel, TendMark, TextBlock, Wordmark } from "./src/ui/components";
import { palette, spacing, type } from "./src/ui/theme";

type HabitStatusProposal = { habit: Habit; action: "archive" | "restore"; fromStatement?: boolean };
const POST_SAVE_ACKNOWLEDGMENT_MS = 6_000;

const formatDate = (isoDate: string) => {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" })
    .format(new Date(year, month - 1, day));
};

const displayQuantity = (value: number) => Number.isInteger(value) ? `${value}` : `${value}`.replace(/0+$/, "").replace(/\.$/, "");

export default function App() {
  return (
    <SafeAreaProvider>
      <TendApp />
    </SafeAreaProvider>
  );
}

function TendApp() {
  const colors = palette("light");
  const [fontsLoaded] = useFonts({
    EBGaramond: require("./assets/eb-garamond.ttf"),
    EBGaramondItalic: require("./assets/eb-garamond-italic.ttf"),
    Karla: require("./assets/karla.ttf"),
    IBMPlexMono: require("./assets/ibm-plex-mono.ttf"),
  });
  const [data, setData] = useState<TendData>(emptyTendData());
  const [loaded, setLoaded] = useState(false);
  const [statement, setStatement] = useState("");
  const [typing, setTyping] = useState(false);
  const [proposal, setProposal] = useState<InterpretationProposal | null>(null);
  const [validatedEntry, setValidatedEntry] = useState<ValidatedHabitEntry | null>(null);
  const [duplicate, setDuplicate] = useState<HabitEntry | null>(null);
  const [statusProposal, setStatusProposal] = useState<HabitStatusProposal | null>(null);
  const [deletionProposal, setDeletionProposal] = useState<HabitEntry | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [reviewingPendingId, setReviewingPendingId] = useState<string | null>(null);
  const [recoveryText, setRecoveryText] = useState("");
  const [reduceMotion, setReduceMotion] = useState(false);
  const [screen, setScreen] = useState<"track" | "reflect">("track");
  const [acknowledgment, setAcknowledgment] = useState<string | null>(null);
  const [creationSendOff, setCreationSendOff] = useState<string | null>(null);
  const [trackViewportHeight, setTrackViewportHeight] = useState(0);
  const saveChain = useRef(Promise.resolve());
  const trackScrollRef = useRef<ScrollView>(null);

  const persist = useCallback((next: TendData) => {
    saveChain.current = saveChain.current
      .then(() => saveTendData(next))
      .catch(() => setMessage("Tend couldn't save local data. Please try again."));
  }, []);

  const commitData = useCallback((change: (current: TendData) => TendData): boolean => {
    const result = attemptDataChange(data, change);
    if (!result.ok) {
      setMessage(result.message);
      return false;
    }
    setData(result.data);
    persist(result.data);
    return true;
  }, [data, persist]);

  useEffect(() => {
    let active = true;
    loadTendData()
      .then(async (stored) => {
        if (!active) return;
        const activeNames = stored.habits.filter((habit) => habit.archivedAt === null).map((habit) => habit.name);
        const archivedNames = stored.habits.filter((habit) => habit.archivedAt !== null).map((habit) => habit.name);
        const pendingStatements = await Promise.all(stored.pendingStatements.map(async (pending) => {
          if (pending.status !== "needsRetry") return pending;
          try {
            return {
              ...pending,
              status: "reviewReady" as const,
              proposal: await interpretHabitStatement(pending.statement, {
                activeHabitNames: activeNames,
                archivedHabitNames: archivedNames,
                submittedAt: new Date(pending.submittedAt),
                timeZone: pending.timeZone,
              }),
            };
          } catch {
            return pending;
          }
        }));
        const retried: TendData = { ...stored, pendingStatements };
        if (!active) return;
        setData(retried);
        if (pendingStatements.some((pending, index) => pending !== stored.pendingStatements[index])) persist(retried);
      })
      .catch(() => setMessage("Tend couldn't read its local data."))
      .finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, [persist]);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => subscription.remove();
  }, []);

  const postAchievementMessage = acknowledgment ?? creationSendOff;

  useEffect(() => {
    if (!postAchievementMessage) return;
    requestAnimationFrame(() => trackScrollRef.current?.scrollTo({ y: 0, animated: !reduceMotion }));
    const timeout = setTimeout(() => {
      setAcknowledgment(null);
      setCreationSendOff(null);
    }, POST_SAVE_ACKNOWLEDGMENT_MS);
    return () => clearTimeout(timeout);
  }, [postAchievementMessage, reduceMotion]);

  const clearReview = useCallback((clearStatement = false) => {
    setProposal(null);
    setValidatedEntry(null);
    setDuplicate(null);
    setMessage(null);
    if (clearStatement) setStatement("");
  }, []);

  const applyProposal = useCallback((nextProposal: InterpretationProposal, sourceData: TendData) => {
    setProposal(nextProposal);
    setValidatedEntry(null);
    setDuplicate(null);
    setMessage(null);
    if (nextProposal.type === "createHabit") {
      const normalizedName = nextProposal.name.trim().toLocaleLowerCase();
      const existing = sourceData.habits.find((habit) => habit.name.trim().toLocaleLowerCase() === normalizedName);
      if (existing?.archivedAt === null) {
        setProposal(null);
        setMessage(`${existing.name} is already an Active Habit.`);
        return;
      }
      if (existing) {
        setProposal(null);
        setTyping(false);
        setStatusProposal({ habit: existing, action: "restore", fromStatement: true });
        return;
      }
    }
    if (nextProposal.type === "logHabitEntry") {
      try {
        setValidatedEntry(validateEntryProposal(sourceData, nextProposal));
        setProposal(null);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Habit Entry could not be validated.");
      }
    } else if (nextProposal.type === "restoreAndLogHabitEntry") {
      const archived = sourceData.habits.find((habit) =>
        habit.archivedAt !== null && habit.name.toLocaleLowerCase() === nextProposal.habitName.toLocaleLowerCase(),
      );
      if (!archived) {
        setProposal({ type: "noMatchingActiveHabit" });
        return;
      }
      const restored = restoreHabit(sourceData, archived.id);
      setValidatedEntry(validateEntryProposal(restored, {
        ...nextProposal,
        type: "logHabitEntry",
      }));
    } else if (nextProposal.type === "unsupported") {
      setMessage("Tend can't interpret that statement yet.");
    }
  }, []);

  const submitStatement = useCallback(async (spokenStatement?: string) => {
    const value = (spokenStatement ?? statement).trim();
    if (!value || isInterpreting) return;
    setStatement(value);
    setIsInterpreting(true);
    setMessage(null);
    try {
      const nextProposal = await interpretHabitStatement(value, {
        activeHabitNames: activeHabits(data).map((habit) => habit.name),
        archivedHabitNames: archivedHabits(data).map((habit) => habit.name),
        submittedAt: new Date(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }, {
        onWaking: () => setMessage("Waking the interpretation service…"),
      });
      applyProposal(nextProposal, data);
    } catch {
      const pending: PendingStatement = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        statement: value,
        submittedAt: Date.now(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        status: "needsRetry",
        proposal: null,
      };
      commitData((current) => ({ ...current, pendingStatements: [...current.pendingStatements, pending] }));
      setMessage("Interpretation is temporarily unavailable. Saved as Needs retry.");
    } finally {
      setIsInterpreting(false);
    }
  }, [applyProposal, commitData, data, isInterpreting, statement]);

  const onHeard = useCallback((heard: string) => {
    setTyping(false);
    setRecoveryText("");
    void submitStatement(heard);
  }, [submitStatement]);

  const speech = useTendSpeech({
    onHeard,
    onRecoveryText: (text) => setRecoveryText(text),
  });

  const resetComposer = useCallback(() => {
    clearReview(true);
    setTyping(false);
    setRecoveryText("");
    speech.reset();
  }, [clearReview, speech]);

  const removeReviewedPending = useCallback((source: TendData): TendData => {
    if (!reviewingPendingId) return source;
    return { ...source, pendingStatements: source.pendingStatements.filter((item) => item.id !== reviewingPendingId) };
  }, [reviewingPendingId]);

  const confirmReview = () => {
    if (proposal?.type === "createHabit") {
      if (commitData((current) => removeReviewedPending(createHabit(current, proposal.name)))) {
        setCreationSendOff(`You're now tracking ${proposal.name}. Good luck—and, most importantly, have fun.`);
        setReviewingPendingId(null);
        resetComposer();
      }
      return;
    }
    if (!validatedEntry) return;
    if (!duplicate) {
      const found = findDuplicate(data, validatedEntry);
      if (found) {
        setDuplicate(found);
        return;
      }
    }
    if (proposal?.type === "restoreAndLogHabitEntry") {
      const archived = data.habits.find((habit) =>
        habit.archivedAt !== null && habit.name.toLocaleLowerCase() === proposal.habitName.toLocaleLowerCase(),
      );
      if (!archived) {
        setMessage("That Habit is no longer archived.");
        return;
      }
      if (commitData((current) => {
        const restored = restoreHabit(current, archived.id);
        const next = nextAcknowledgment(removeReviewedPending(saveHabitEntry(restored, validatedEntry)));
        setAcknowledgment(next.message);
        return next.data;
      })) {
        setReviewingPendingId(null);
        resetComposer();
      }
      return;
    }
    if (commitData((current) => {
      const next = nextAcknowledgment(removeReviewedPending(saveHabitEntry(current, validatedEntry)));
      setAcknowledgment(next.message);
      return next.data;
    })) {
      setReviewingPendingId(null);
      resetComposer();
    }
  };

  const chooseHabit = (name: string) => {
    if (proposal?.type !== "clarifyHabitEntry") return;
    const selected: InterpretationProposal = {
      type: "logHabitEntry",
      habitName: name,
      durationMinutes: proposal.durationMinutes,
      activityDate: proposal.activityDate,
      quantityAmount: proposal.quantityAmount,
      quantityUnit: proposal.quantityUnit,
    };
    applyProposal(selected, data);
  };

  const updateEntryReview = (entry: Omit<ValidatedHabitEntry, "habitId">) => {
    const next: InterpretationProposal = {
      type: "logHabitEntry", habitName: entry.habitName, durationMinutes: entry.durationMinutes,
      activityDate: entry.activityDate, quantityAmount: entry.quantityAmount, quantityUnit: entry.quantityUnit,
    };
    applyProposal(next, data);
  };

  const discardReviewedPending = () => {
    if (!reviewingPendingId) return;
    commitData((current) => ({ ...current, pendingStatements: current.pendingStatements.filter((item) => item.id !== reviewingPendingId) }));
    setReviewingPendingId(null);
  };

  const editStatement = () => {
    discardReviewedPending();
    clearReview(false);
    setTyping(true);
  };

  const cancelReview = () => {
    discardReviewedPending();
    resetComposer();
  };

  const reviewReady = () => {
    const pending = data.pendingStatements.find((item) => item.status === "reviewReady" && item.proposal);
    if (!pending?.proposal) return;
    setStatement(pending.statement);
    setReviewingPendingId(pending.id);
    applyProposal(pending.proposal, data);
  };

  const active = useMemo(() => activeHabits(data), [data]);
  const archived = useMemo(() => archivedHabits(data), [data]);
  const reviewReadyCount = data.pendingStatements.filter((item) => item.status === "reviewReady").length;
  const needsRetryCount = data.pendingStatements.filter((item) => item.status === "needsRetry").length;
  const inReview = proposal !== null || validatedEntry !== null || duplicate !== null;
  const listening = ["starting", "listening", "stopping", "cancelling"].includes(speech.status);

  if (!fontsLoaded || !loaded) {
    return (
      <SafeAreaView edges={["top", "right", "bottom", "left"]} style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.quietAccent} accessibilityLabel="Loading Tend" />
      </SafeAreaView>
    );
  }

  if (screen === "reflect") {
    return <ReflectScreen colors={colors} data={data} onBack={() => setScreen("track")} />;
  }

  return (
    <SafeAreaView edges={["top", "right", "bottom", "left"]} style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar style={colors.dark ? "light" : "dark"} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <ScrollView
          ref={trackScrollRef}
          onLayout={({ nativeEvent }) => setTrackViewportHeight(nativeEvent.layout.height)}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          accessibilityLabel="Tend Track"
        >
          <View style={[styles.trackHero, trackViewportHeight > 0 ? { minHeight: trackViewportHeight } : undefined]}>
            <View style={styles.header}>
              <TendMark />
              <Pressable
                accessibilityHint="Open your saved activity reflection"
                accessibilityRole="button"
                onPress={() => setScreen("reflect")}
                style={[styles.reflect, { borderColor: colors.hairline }]}
              >
                <Text style={[type.tertiary, { color: colors.mutedText }]}>Reflect</Text>
              </Pressable>
            </View>
            <Wordmark colors={colors} subdued={listening} />

            <View style={styles.composerSpace}>
              {postAchievementMessage ? (
                <View style={styles.postSaveComposer}>
                  <Acknowledgment colors={colors} message={postAchievementMessage} />
                  <ReadyComposer
                    colors={colors}
                    speechDetail={speech.detail}
                    heard={speech.status === "heard" ? speech.finalTranscript : ""}
                    onSpeak={speech.start}
                    onType={() => {
                      if (recoveryText) setStatement(recoveryText);
                      setTyping(true);
                    }}
                  />
                </View>
              ) : listening ? (
                <ListeningComposer
                  colors={colors}
                  transcript={speech.partialTranscript || speech.finalTranscript}
                  volume={speech.volume}
                  reduceMotion={reduceMotion}
                  onDone={speech.done}
                  onCancel={speech.cancel}
                  canAct={speech.status === "starting" || speech.status === "listening"}
                />
              ) : inReview ? (
                <ReviewComposer
                  colors={colors}
                  statement={statement}
                  proposal={proposal}
                  validatedEntry={validatedEntry}
                  duplicate={duplicate}
                  onConfirm={confirmReview}
                  onChooseHabit={chooseHabit}
                  onEdit={editStatement}
                  onUpdateEntry={updateEntryReview}
                  onCancel={cancelReview}
                />
              ) : typing ? (
                <TypedComposer
                  colors={colors}
                  statement={statement}
                  setStatement={setStatement}
                  onSubmit={() => { void submitStatement(); }}
                  onSpeak={speech.start}
                  isInterpreting={isInterpreting}
                  showCreationHint={active.length === 0}
                />
              ) : (
                <ReadyComposer
                  colors={colors}
                  speechDetail={speech.detail}
                  heard={speech.status === "heard" ? speech.finalTranscript : ""}
                  onSpeak={speech.start}
                  onType={() => {
                    if (recoveryText) setStatement(recoveryText);
                    setTyping(true);
                  }}
                />
              )}
              {message ? <Text accessibilityLiveRegion="polite" style={[type.body, styles.message, { color: colors.error }]}>{message}</Text> : null}
            </View>
          </View>

          {needsRetryCount > 0 ? (
            <TextBlock colors={colors} style={{ color: colors.mutedText }}>
              {needsRetryCount} statement{needsRetryCount === 1 ? "" : "s"} Needs retry. Tend will retry when interpretation is available.
            </TextBlock>
          ) : null}
          {reviewReadyCount > 0 && !inReview ? (
            <InlineSection colors={colors}>
              <Text style={[type.title, { color: colors.primaryText }]}>Interpretation ready for review</Text>
              <TextBlock colors={colors}>Review it before Tend saves anything.</TextBlock>
              <Action colors={colors} onPress={reviewReady}>Review</Action>
            </InlineSection>
          ) : null}

          <Rule colors={colors} />
          <History colors={colors} data={data} onDelete={setDeletionProposal} />
          <Rule colors={colors} />
          <HabitManagement
            colors={colors}
            active={active}
            archived={archived}
            onArchive={(habit) => setStatusProposal({ habit, action: "archive" })}
            onRestore={(habit) => setStatusProposal({ habit, action: "restore" })}
          />
        </ScrollView>
        <ConfirmationDialog
          colors={colors}
          title={statusProposal ? `${statusProposal.action === "archive" ? "Archive" : "Restore"} ${statusProposal.habit.name}?` : ""}
          detail={statusProposal?.action === "archive"
            ? "This Habit will leave Active Habits, but its Habit Entries will be kept."
            : "This Habit will return to Active Habits and can be matched again."}
          confirmLabel={statusProposal?.action === "archive" ? "Confirm archive" : "Confirm restore"}
          visible={statusProposal !== null}
          onConfirm={() => {
            if (!statusProposal) return;
            const changed = commitData((current) => statusProposal.action === "archive"
              ? archiveHabit(current, statusProposal.habit.id)
              : restoreHabit(current, statusProposal.habit.id));
            if (changed) {
              setStatusProposal(null);
              if (statusProposal.fromStatement) resetComposer();
            }
          }}
          onCancel={() => setStatusProposal(null)}
        />
        <ConfirmationDialog
          colors={colors}
          title="Delete this activity?"
          detail={deletionProposal ? `${entrySummary(deletionProposal, data)} on ${formatDate(deletionProposal.activityDate)} will be removed.` : ""}
          confirmLabel="Confirm deletion"
          visible={deletionProposal !== null}
          onConfirm={() => {
            if (deletionProposal && commitData((current) => deleteHabitEntry(current, deletionProposal.id))) {
              setDeletionProposal(null);
            }
          }}
          onCancel={() => setDeletionProposal(null)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type ColorProps = { colors: ReturnType<typeof palette> };

function ReadyComposer({ colors, speechDetail, heard, onSpeak, onType }: ColorProps & {
  speechDetail: string;
  heard: string;
  onSpeak: () => void;
  onType: () => void;
}) {
  return (
    <View style={styles.composer}>
      {heard ? (
        <>
          <SectionLabel colors={colors}>You said</SectionLabel>
          <Text style={[type.transcript, styles.center, { color: colors.primaryText }]}>“{heard}”</Text>
        </>
      ) : (
        <>
          <Text style={[type.prompt, styles.center, { color: colors.primaryText }]}>What did you do?</Text>
        </>
      )}
      <Action colors={colors} onPress={onSpeak}>Hold to speak</Action>
      <Action colors={colors} variant="tertiary" onPress={onType}>Type instead</Action>
      {speechDetail !== "Ready. Nothing is submitted or saved." ? (
        <Text accessibilityLiveRegion="polite" style={[type.metadata, styles.center, { color: colors.mutedText }]}>{speechDetail}</Text>
      ) : null}
    </View>
  );
}

function ListeningComposer({ colors, transcript, volume, reduceMotion, onDone, onCancel, canAct }: ColorProps & {
  transcript: string;
  volume: number;
  reduceMotion: boolean;
  onDone: () => void;
  onCancel: () => void;
  canAct: boolean;
}) {
  const normalized = Math.max(0, Math.min(1, (volume + 2) / 12));
  const heights = reduceMotion ? [8, 12, 18, 12, 8] : [8, 12 + 18 * normalized, 16 + 22 * normalized, 10 + 20 * normalized, 8 + 10 * normalized];
  return (
    <View style={styles.composer} accessibilityLiveRegion="polite">
      <View accessible={false} style={styles.levels}>
        {heights.map((height, index) => <View key={index} style={[styles.level, { height, backgroundColor: colors.quietAccent }]} />)}
      </View>
      <SectionLabel colors={colors}>Listening</SectionLabel>
      <Text accessibilityLabel={`Listening. ${transcript || "No words recognized yet."}`} style={[type.transcript, styles.center, { color: colors.primaryText }]}>
        {transcript || "Say what you did…"}
      </Text>
      <Action colors={colors} variant="secondary" disabled={!canAct} onPress={onDone}>Done</Action>
      <Action colors={colors} variant="retreat" disabled={!canAct} onPress={onCancel}>Cancel</Action>
    </View>
  );
}

function TypedComposer({ colors, statement, setStatement, onSubmit, onSpeak, isInterpreting, showCreationHint }: ColorProps & {
  statement: string;
  setStatement: (value: string) => void;
  onSubmit: () => void;
  onSpeak: () => void;
  isInterpreting: boolean;
  showCreationHint: boolean;
}) {
  return (
    <View style={styles.composer}>
      <SectionLabel colors={colors}>Habit Statement</SectionLabel>
      <TextInput
        accessibilityLabel="Describe what you want to track"
        autoFocus
        multiline
        onChangeText={setStatement}
        onSubmitEditing={onSubmit}
        placeholder={showCreationHint ? "Try ‘I want to track meditation.’" : "I meditated for 10 minutes today"}
        placeholderTextColor={colors.mutedText}
        returnKeyType="done"
        style={[styles.input, type.field, { borderBottomColor: colors.quietAccent, color: colors.primaryText }]}
        value={statement}
      />
      <Action colors={colors} disabled={!statement.trim() || isInterpreting} onPress={onSubmit}>{isInterpreting ? "Interpreting…" : "Review statement"}</Action>
      <Action colors={colors} variant="tertiary" onPress={onSpeak}>Speak instead</Action>
    </View>
  );
}

function ReviewComposer({ colors, statement, proposal, validatedEntry, duplicate, onConfirm, onChooseHabit, onEdit, onUpdateEntry, onCancel }: ColorProps & {
  statement: string;
  proposal: InterpretationProposal | null;
  validatedEntry: ValidatedHabitEntry | null;
  duplicate: HabitEntry | null;
  onConfirm: () => void;
  onChooseHabit: (name: string) => void;
  onEdit: () => void;
  onUpdateEntry: (entry: Omit<ValidatedHabitEntry, "habitId">) => void;
  onCancel: () => void;
}) {
  const sourceDatePhrase = proposal && "sourceDatePhrase" in proposal ? proposal.sourceDatePhrase : undefined;
  const [editingEntry, setEditingEntry] = useState(false);
  const [habitName, setHabitName] = useState(validatedEntry?.habitName ?? "");
  const [date, setDate] = useState(validatedEntry?.activityDate ?? "");
  const [duration, setDuration] = useState(validatedEntry?.durationMinutes?.toString() ?? "");
  const [quantity, setQuantity] = useState(validatedEntry?.quantityAmount?.toString() ?? "");
  const [unit, setUnit] = useState(validatedEntry?.quantityUnit ?? "");
  const applyEdits = () => {
    const durationMinutes = duration.trim() ? Number(duration) : null;
    const quantityAmount = quantity.trim() ? Number(quantity) : null;
    onUpdateEntry({ habitName: habitName.trim(), activityDate: date.trim(), durationMinutes, quantityAmount, quantityUnit: quantityAmount === null ? null : unit.trim() || null });
    setEditingEntry(false);
  };
  return (
    <View style={styles.composer}>
      <SectionLabel colors={colors}>You said</SectionLabel>
      <Text style={[type.transcript, styles.center, { color: colors.mutedText }]}>“{statement}”</Text>
      <Rule colors={colors} />
      {proposal?.type === "createHabit" ? (
        <>
          <Text style={[type.title, styles.center, { color: colors.primaryText }]}>Create {proposal.name}?</Text>
          <TextBlock colors={colors} style={styles.center}>This will add a new Active Habit.</TextBlock>
          <Action colors={colors} onPress={onConfirm}>Confirm</Action>
        </>
      ) : null}
      {proposal?.type === "clarifyHabitEntry" ? (
        <>
          <Text style={[type.title, styles.center, { color: colors.primaryText }]}>Which Habit did you mean?</Text>
          {proposal.candidateHabitNames.map((name) => (
            <Action key={name} colors={colors} variant="secondary" onPress={() => onChooseHabit(name)}>{name}</Action>
          ))}
        </>
      ) : null}
      {proposal?.type === "noMatchingActiveHabit" ? (
        <>
          <Text style={[type.title, styles.center, { color: colors.primaryText }]}>No matching Active Habit</Text>
          <TextBlock colors={colors} style={styles.center}>Create the Habit first with a separate statement, such as “I want to track meditation.”</TextBlock>
        </>
      ) : null}
      {proposal?.type === "futureActivityDate" ? (
        <>
          <Text style={[type.title, styles.center, { color: colors.primaryText }]}>Future activity can’t be saved</Text>
          <TextBlock colors={colors} style={styles.center}>Habit Entries record activities that already happened. Use today or yesterday.</TextBlock>
        </>
      ) : null}
      {proposal?.type === "unsupported" ? (
        <TextBlock colors={colors} style={styles.center}>Tend can't interpret that statement yet.</TextBlock>
      ) : null}
      {proposal?.type === "restoreAndLogHabitEntry" && validatedEntry ? (
        <>
          <Text style={[type.title, styles.center, { color: colors.primaryText }]}>Restore {validatedEntry.habitName} and save this entry?</Text>
          <TextBlock colors={colors} style={styles.center}>This Habit is archived. Confirming will restore it and save the activity together.</TextBlock>
          {duplicate ? <TextBlock colors={colors} style={styles.center}>A matching Habit Entry is already saved. Confirm to keep both entries.</TextBlock> : null}
          {validatedEntry.durationMinutes !== null ? <TextBlock colors={colors}>Duration: {validatedEntry.durationMinutes} minutes</TextBlock> : null}
          {validatedEntry.quantityAmount !== null ? <TextBlock colors={colors}>Quantity: {displayQuantity(validatedEntry.quantityAmount)} {validatedEntry.quantityUnit}</TextBlock> : null}
          <TextBlock colors={colors}>Activity Date: {formatDate(validatedEntry.activityDate)}</TextBlock>
          {sourceDatePhrase ? <Text style={[type.metadata, { color: colors.mutedText }]}>Recognized date: “{sourceDatePhrase}”</Text> : null}
          <Action colors={colors} onPress={onConfirm}>{duplicate ? "Restore and save anyway" : "Restore and save"}</Action>
        </>
      ) : null}
      {validatedEntry && proposal?.type !== "restoreAndLogHabitEntry" ? (
        <>
          <Text style={[type.title, styles.center, { color: colors.primaryText }]}>{duplicate ? "Possible duplicate Habit Entry" : "Habit Entry proposal"}</Text>
          {duplicate ? <TextBlock colors={colors} style={styles.center}>A matching Habit Entry is already saved. Save anyway to keep both entries.</TextBlock> : null}
          <TextBlock colors={colors}>Habit: {validatedEntry.habitName}</TextBlock>
          {validatedEntry.durationMinutes !== null ? <TextBlock colors={colors}>Duration: {validatedEntry.durationMinutes} minutes</TextBlock> : null}
          {validatedEntry.quantityAmount !== null ? <TextBlock colors={colors}>Quantity: {displayQuantity(validatedEntry.quantityAmount)} {validatedEntry.quantityUnit}</TextBlock> : null}
          <TextBlock colors={colors}>Activity Date: {formatDate(validatedEntry.activityDate)}</TextBlock>
          {sourceDatePhrase ? <Text style={[type.metadata, { color: colors.mutedText }]}>Recognized date: “{sourceDatePhrase}”</Text> : null}
          <TextBlock colors={colors}>Review this interpretation before saving.</TextBlock>
          <Action colors={colors} onPress={onConfirm}>{duplicate ? "Save anyway" : "Save Habit Entry"}</Action>
          {!editingEntry ? <Action colors={colors} variant="tertiary" onPress={() => setEditingEntry(true)}>Edit entry details</Action> : <View style={styles.editFields}>
            <TextInput accessibilityLabel="Habit name" value={habitName} onChangeText={setHabitName} style={[styles.fieldInput, type.field, { color: colors.primaryText, borderBottomColor: colors.quietAccent }]} />
            <TextInput accessibilityLabel="Activity Date in YYYY-MM-DD" value={date} onChangeText={setDate} style={[styles.fieldInput, type.field, { color: colors.primaryText, borderBottomColor: colors.quietAccent }]} />
            <TextInput accessibilityLabel="Duration in minutes, optional" value={duration} onChangeText={setDuration} keyboardType="numeric" style={[styles.fieldInput, type.field, { color: colors.primaryText, borderBottomColor: colors.quietAccent }]} />
            <TextInput accessibilityLabel="Quantity, optional" value={quantity} onChangeText={setQuantity} keyboardType="numeric" style={[styles.fieldInput, type.field, { color: colors.primaryText, borderBottomColor: colors.quietAccent }]} />
            {quantity.trim() ? <TextInput accessibilityLabel="Quantity unit" value={unit} onChangeText={setUnit} style={[styles.fieldInput, type.field, { color: colors.primaryText, borderBottomColor: colors.quietAccent }]} /> : null}
            <Action colors={colors} variant="secondary" onPress={applyEdits}>Apply corrections</Action>
          </View>}
        </>
      ) : null}
      <View style={styles.actionRow}>
        <Action colors={colors} variant="tertiary" style={styles.flex} onPress={onEdit}>Edit statement</Action>
        <Action colors={colors} variant="retreat" style={styles.flex} onPress={onCancel}>Cancel</Action>
      </View>
    </View>
  );
}

function Acknowledgment({ colors, message }: ColorProps & { message: string }) {
  return (
    <View accessibilityLiveRegion="polite" style={[styles.acknowledgment, { backgroundColor: colors.dark ? "#172927" : "#D9E7E1", borderColor: colors.emphasis }]}>
      <Text style={[type.transcript, styles.center, { color: colors.primaryText }]}>{message}</Text>
    </View>
  );
}

function ConfirmationDialog({ colors, title, detail, confirmLabel, visible, onConfirm, onCancel }: ColorProps & {
  title: string;
  detail: string;
  confirmLabel: string;
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!visible) return null;
  return (
    <Modal transparent animationType="fade" visible onRequestClose={() => undefined}>
      <View accessibilityViewIsModal style={styles.modalBackdrop}>
        <View style={[styles.modalCard, { backgroundColor: colors.background, borderColor: colors.emphasis }]}>
          <Text style={[type.heading, styles.center, { color: colors.primaryText }]}>{title}</Text>
          <TextBlock colors={colors} style={styles.center}>{detail}</TextBlock>
          <Action colors={colors} onPress={onConfirm}>{confirmLabel}</Action>
          <Action colors={colors} variant="retreat" onPress={onCancel}>Cancel</Action>
        </View>
      </View>
    </Modal>
  );
}

function ReflectScreen({ colors, data, onBack }: ColorProps & { data: TendData; onBack: () => void }) {
  const range = currentWeekRange();
  const weekly = reflectionCounts(data, range);
  const total = reflectionCounts(data);
  const rangeLabel = `${formatDate(range.start)} – ${formatDate(range.end)}`;
  return (
    <SafeAreaView edges={["top", "right", "bottom", "left"]} style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar style={colors.dark ? "light" : "dark"} />
      <ScrollView contentContainerStyle={styles.content} accessibilityLabel="Tend Reflect">
        <View style={styles.header}>
          <Action colors={colors} variant="secondary" onPress={onBack}>Back</Action>
          <Text style={[type.heading, { color: colors.primaryText }]}>Reflect</Text>
        </View>
        {total.length === 0 ? <Text style={[type.prompt, styles.center, { color: colors.primaryText }]}>No activity saved yet. When you save an activity, it will appear here.</Text> : <>
          <View style={styles.section}>
            <SectionLabel colors={colors}>This week</SectionLabel>
            <Text style={[type.metadata, styles.center, { color: colors.mutedText }]}>{rangeLabel}</Text>
            {weekly.length === 0 ? <TextBlock colors={colors} style={styles.center}>No activity was saved this week.</TextBlock> : <ReflectionCounts colors={colors} items={weekly} />}
          </View>
          <Rule colors={colors} />
          <View style={styles.section}>
            <SectionLabel colors={colors}>In total</SectionLabel>
            <ReflectionCounts colors={colors} items={total} />
          </View>
        </>}
      </ScrollView>
    </SafeAreaView>
  );
}

function ReflectionCounts({ colors, items }: ColorProps & { items: ReturnType<typeof reflectionCounts> }) {
  return <View style={styles.section}>{items.map(({ habit, count }) => <Text key={habit.id} style={[type.list, { color: colors.primaryText }]}>{habit.name}{habit.archivedAt !== null ? " (archived)" : ""} — {count} {count === 1 ? "time" : "times"}</Text>)}</View>;
}

function History({ colors, data, onDelete }: ColorProps & { data: TendData; onDelete: (entry: HabitEntry) => void }) {
  return (
    <View style={styles.section} accessibilityLabel="Recent Habit Entries">
      <SectionLabel colors={colors}>Last 5 recent activities</SectionLabel>
      {data.entries.length === 0 ? (
        <Text style={[type.body, styles.center, { color: colors.mutedText }]}>Your confirmed activity will appear here.</Text>
      ) : recentActivities(data).map((entry) => (
        <View key={entry.id} style={styles.row} accessibilityLabel={`Recent Habit Entry: ${entrySummary(entry, data)}`}>
          <View style={styles.flex}>
            <Text style={[type.list, { color: colors.primaryText }]}>{entrySummary(entry, data)}</Text>
            <Text style={[type.metadata, { color: colors.mutedText }]}>{formatDate(entry.activityDate)}</Text>
          </View>
          <Action colors={colors} variant="retreat" onPress={() => onDelete(entry)} accessibilityLabel={`Delete ${entrySummary(entry, data)}`}>Delete</Action>
        </View>
      ))}
    </View>
  );
}

function HabitManagement({ colors, active, archived, onArchive, onRestore }: ColorProps & {
  active: Habit[];
  archived: Habit[];
  onArchive: (habit: Habit) => void;
  onRestore: (habit: Habit) => void;
}) {
  return (
    <View style={styles.section}>
      <SectionLabel colors={colors}>Active Habits</SectionLabel>
      {active.length === 0 ? <Text style={[type.body, styles.center, { color: colors.mutedText }]}>No Active Habits yet.</Text> : active.map((habit) => (
        <View key={habit.id} style={styles.row}>
          <Text style={[type.list, styles.flex, { color: colors.primaryText }]}>{habit.name}</Text>
          <Action colors={colors} variant="retreat" onPress={() => onArchive(habit)} accessibilityLabel={`Archive ${habit.name}`}>Archive</Action>
        </View>
      ))}
      {archived.length > 0 ? (
        <>
          <Rule colors={colors} />
          <SectionLabel colors={colors}>Archived Habits</SectionLabel>
          {archived.map((habit) => (
            <View key={habit.id} style={styles.row}>
              <Text style={[type.list, styles.flex, { color: colors.mutedText }]}>{habit.name}</Text>
              <Action colors={colors} variant="tertiary" onPress={() => onRestore(habit)} accessibilityLabel={`Restore ${habit.name}`}>Restore</Action>
            </View>
          ))}
        </>
      ) : null}
    </View>
  );
}

function entrySummary(entry: HabitEntry, data: TendData): string {
  const habitName = data.habits.find((habit) => habit.id === entry.habitId)?.name ?? "Habit";
  if (entry.durationMinutes !== null) return `${habitName} — ${entry.durationMinutes} minutes`;
  if (entry.quantityAmount !== null) return `${habitName} — ${displayQuantity(entry.quantityAmount)} ${entry.quantityUnit}`;
  return habitName;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: 26, paddingTop: 16, paddingBottom: 52, alignItems: "center", gap: spacing.md },
  header: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  trackHero: { width: "100%", alignItems: "center", gap: spacing.md },
  reflect: { minHeight: 44, borderWidth: 1, borderRadius: 999, alignItems: "center", justifyContent: "center", paddingHorizontal: 20, opacity: 0.68 },
  composerSpace: { width: "100%", minHeight: 345, flexGrow: 1, justifyContent: "center", paddingBottom: 180 },
  composer: { width: "100%", gap: spacing.sm },
  postSaveComposer: { width: "100%", gap: spacing.md },
  center: { textAlign: "center" },
  input: { minHeight: 92, maxHeight: 190, borderBottomWidth: 1, textAlignVertical: "top", paddingHorizontal: 4, paddingVertical: 12 },
  fieldInput: { minHeight: 44, borderBottomWidth: 1, paddingHorizontal: 4, paddingVertical: 8 },
  editFields: { width: "100%", gap: spacing.xs },
  message: { width: "100%", textAlign: "center" },
  levels: { height: 40, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  level: { width: 3, borderRadius: 2 },
  actionRow: { flexDirection: "row", gap: spacing.xs },
  acknowledgment: { width: "100%", borderTopWidth: 1, paddingVertical: spacing.md, paddingHorizontal: spacing.sm },
  modalBackdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg, backgroundColor: "rgba(0, 0, 0, 0.38)" },
  modalCard: { width: "100%", maxWidth: 420, borderWidth: 1, borderRadius: 20, padding: spacing.lg, gap: spacing.md },
  section: { width: "100%", gap: spacing.sm },
  row: { width: "100%", minHeight: 52, flexDirection: "row", alignItems: "center", gap: spacing.sm },
});
