import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { StudentRanking, TurmaRanking } from '@/components/ranking';
import { ScreenContainer } from '@/components/ui';
import { useRankingData } from '@/hooks/useRankingData';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function RankingScreen() {
  const {
    colors,
    mainTab, setMainTab,
    classes, selectedClass, setSelectedClass,
    ranking, classAvg,
    turmaRanking,
  } = useRankingData();

  return (
    <ProtectedRoute>
      <ScreenContainer showBack showNav>
        {/* Title */}
        <View style={styles.titleSection}>
          <View style={[styles.titleIcon, { backgroundColor: colors.accent + '18' }]}>
            <Ionicons name="trophy" size={22} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.pageTitle, { color: colors.text }]}>Ranking</Text>
            <Text style={[styles.pageSub, { color: colors.mutedText }]}>Desempenho comparativo</Text>
          </View>
        </View>

        {/* Main tabs */}
        <View style={[styles.mainTabs, { backgroundColor: colors.input }]}>
          <Pressable
            onPress={() => setMainTab('alunos')}
            style={[styles.mainTab, mainTab === 'alunos' && { backgroundColor: colors.surface, shadowColor: '#09090B', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 }]}
          >
            <Ionicons name="people" size={15} color={mainTab === 'alunos' ? colors.accent : colors.mutedText} />
            <Text style={[styles.mainTabText, { color: mainTab === 'alunos' ? colors.accent : colors.mutedText }]}>
              Alunos
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setMainTab('turmas')}
            style={[styles.mainTab, mainTab === 'turmas' && { backgroundColor: colors.surface, shadowColor: '#09090B', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 }]}
          >
            <Ionicons name="school" size={15} color={mainTab === 'turmas' ? colors.accent : colors.mutedText} />
            <Text style={[styles.mainTabText, { color: mainTab === 'turmas' ? colors.accent : colors.mutedText }]}>
              Turmas
            </Text>
          </Pressable>
        </View>

        {/* Tab content */}
        {mainTab === 'alunos' && (
          <StudentRanking
            classes={classes}
            selectedClass={selectedClass}
            setSelectedClass={setSelectedClass}
            ranking={ranking}
            classAvg={classAvg}
            colors={colors}
          />
        )}

        {mainTab === 'turmas' && (
          <TurmaRanking turmaRanking={turmaRanking} colors={colors} />
        )}
      </ScreenContainer>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  titleSection: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 4 },
  titleIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  pageTitle: { fontSize: 22, fontWeight: '700', letterSpacing: 0, lineHeight: 26 },
  pageSub: { fontSize: 13, lineHeight: 18, marginTop: 2 },
  mainTabs: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  mainTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 11,
  },
  mainTabText: { fontSize: 14, fontWeight: '700' },
});
