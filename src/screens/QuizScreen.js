import React from 'react';
import { View, Pressable } from 'react-native';
import { T, useT, Header, BackBtn, StatGrid, Grid, Kicker, Btn } from '../components/ui';

function Answer({ a }) {
  const th = useT();
  const base = { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 56, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1 };
  const K = {
    normal: { box: { borderColor: th.ink(0.1), backgroundColor: th.surface }, mark: a.letter, markC: th.muted, c: th.text, w: 500 },
    correct: { box: { borderColor: th.green, backgroundColor: 'rgba(127,214,160,.12)' }, mark: '✓', markC: th.green, c: th.text, w: 600 },
    wrong: { box: { borderColor: th.red, backgroundColor: 'rgba(255,155,155,.1)' }, mark: '✕', markC: th.red, c: th.text, w: 500 },
    dim: { box: { borderColor: th.ink(0.05), backgroundColor: 'transparent' }, mark: a.letter, markC: th.muted2, c: th.muted2, w: 500 },
  }[a.kind];
  const inner = (<>
    <T mono w={500} size={12} color={K.markC}>{K.mark}</T>
    <T size={15.5} w={K.w} color={K.c} style={{ flex: 1 }}>{a.t}</T>
  </>);
  if (a.kind === 'normal') return <Pressable onPress={a.pick} style={[base, K.box]}>{inner}</Pressable>;
  return <View style={[base, K.box]}>{inner}</View>;
}

export default function QuizScreen({ v }) {
  const th = useT(), tx = v.tx, q = v.quiz, rank = v.rank;
  return (
    <View style={{ gap: 18 }}>
      <BackBtn label={tx.back} onPress={v.back} />
      <Header kicker={v.todayLabel} title={tx.quizTitle} />

      <StatGrid cols={3} cells={[
        { k: tx.streak, node: <T size={22} w={700} color={th.amber}>{q.streak}<T size={12} w={500} color={th.muted}> {tx.days}</T></T> },
        { k: tx.best, node: <T size={22} w={700}>{q.best}</T> },
        { k: tx.todayCap, node: <T size={22} w={700}>{q.scoreLabel}</T> },
      ]} />

      <Grid cols={3} gap={8}>
        {q.levels.map((lv, i) => (
          <Pressable key={i} onPress={lv.pick} style={[{ height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 1 },
            lv.active ? { backgroundColor: th.amber } : { borderWidth: 1, borderColor: th.ink(0.1) }]}>
            <T size={14} w={lv.active ? 600 : 500} color={lv.active ? th.onAccent : th.text2}>{lv.label}</T>
            <T mono w={lv.active ? 500 : 400} size={10} color={lv.active ? th.onAccent : th.muted}>{lv.status}</T>
          </Pressable>
        ))}
      </Grid>

      <Pressable onPress={v.openBadges} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, backgroundColor: 'rgba(240,180,106,.08)' }}>
        <T size={14}><T size={14} w={600} color={th.amber}>{rank.name}</T> · {rank.xp} XP</T>
        <T mono w={500} size={11} color={th.amber}>{rank.badgeCount} {tx.badgesArrow}</T>
      </Pressable>

      {q.playing && (<>
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <T mono w={500} size={11} color={th.muted}>{tx.question} {q.qnum} / 5</T>
            <T mono w={500} size={11} color={th.blue} upper>{q.topicCat}</T>
          </View>
          <View style={{ height: 4, borderRadius: 2, backgroundColor: th.ink(0.08), overflow: 'hidden' }}>
            <View style={{ height: '100%', width: q.pct, backgroundColor: th.amber }} />
          </View>
        </View>
        <T size={23} w={600} lh={1.25} ls={-0.01}>{q.question}</T>
        <View style={{ gap: 10 }}>{q.answers.map((a, i) => <Answer key={i} a={a} />)}</View>
        {(q.canHint || q.canSkip) && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {q.canHint && <Pressable onPress={q.hint} style={{ flex: 1, height: 46, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(240,180,106,.5)', alignItems: 'center', justifyContent: 'center' }}><T size={12.5} w={500} color={th.amber}>{tx.hintBtn}</T></Pressable>}
            {q.canSkip && <Pressable onPress={q.skip} style={{ flex: 1, height: 46, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(143,184,255,.5)', alignItems: 'center', justifyContent: 'center' }}><T size={12.5} w={500} color={th.blue}>{tx.skipBtn}</T></Pressable>}
          </View>
        )}
        {q.retrying && (
          <View style={{ borderRadius: 18, backgroundColor: 'rgba(255,155,155,.08)', borderWidth: 1, borderColor: 'rgba(255,155,155,.3)', paddingVertical: 14, paddingHorizontal: 18, gap: 4 }}>
            <T mono w={600} size={12} ls={0.1} color={th.red}>{tx.tryAgain}</T>
            <T size={14} lh={1.5} color={th.text2}>{tx.tryAgainSub}</T>
          </View>
        )}
        {q.answered && (
          <View style={{ borderRadius: 18, backgroundColor: th.surface, borderWidth: 1, borderColor: th.ink(0.06), paddingVertical: 16, paddingHorizontal: 18, gap: 10 }}>
            <T mono w={600} size={12} ls={0.1} color={th.green}>{q.solvedLabel}</T>
            <T size={14.5} lh={1.5} color={th.text2}>{q.why}</T>
            <Btn label={q.nextLabel} onPress={q.next} variant="amber" height={48} size={15} style={{ marginTop: 4 }} />
          </View>
        )}
      </>)}

      {q.finished && (<>
        <View style={{ borderRadius: 22, paddingVertical: 24, paddingHorizontal: 20, backgroundColor: th.surface, borderWidth: 1, borderColor: 'rgba(240,180,106,.3)', alignItems: 'center', gap: 6 }}>
          <T mono w={500} size={11} ls={0.14} color={th.amber}>{tx.todayScore}</T>
          <T size={56} w={700} ls={-0.03} lh={1.1}>{q.score}<T size={26} w={700} color={th.muted}>/5</T></T>
          <T size={15} color={th.text2} align="center">{q.msg}</T>
          <T mono w={500} size={12} color={th.muted} style={{ marginTop: 8 }}>{tx.newQsIn} {q.nextIn}</T>
          <Btn label={tx.shareScore} onPress={q.share} variant="amber" height={42} radius={21} style={{ marginTop: 10, paddingHorizontal: 20 }} />
        </View>
        <Kicker>{tx.review}</Kicker>
        {q.review.map((r, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 12, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: th.ink(0.06) }}>
            <View style={{ width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: r.ok ? 'rgba(127,214,160,.15)' : 'rgba(255,155,155,.12)' }}>
              <T size={12} color={r.ok ? th.green : th.red}>{r.ok ? '✓' : '✕'}</T>
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <T size={14.5} w={500} lh={1.35}>{r.q}</T>
              <T mono size={12} color={th.muted}>{tx.answer}: {r.correct}</T>
              {r.hasTopic && <T size={13} color={th.amber} onPress={r.open}>{tx.readAbout} {r.topic} →</T>}
            </View>
          </View>
        ))}
      </>)}
    </View>
  );
}
