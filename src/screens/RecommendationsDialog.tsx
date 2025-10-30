// src/screens/performance/underperforming/RecommendationsDialog.tsx

import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  Button,
  Card,
  CardHeader,
  Text,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { Warning24Regular, Comment24Regular } from "@fluentui/react-icons";
import { type AgentMonthlyResults, type Recommendation } from '../services/api';

const useStyles = makeStyles({
  notesContainer: {
    padding: tokens.spacingVerticalM,
    borderLeftColor: tokens.colorBrandBackground,
    borderLeftWidth: '4px',
    borderLeftStyle: 'solid',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  resultGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingVerticalS,
    marginBottom: tokens.spacingVerticalL,
  },
  critical: {
    color: tokens.colorPaletteRedForeground1,
    fontWeight: tokens.fontWeightBold,
  }
});

interface RecommendationsDialogProps {
  isOpen: boolean;
  onDismiss: () => void;
  agentName: string;
  monthlyResults: AgentMonthlyResults;
  recommendation: Recommendation;
}

export default function RecommendationsDialog({ 
  isOpen, 
  onDismiss, 
  agentName, 
  monthlyResults, 
  recommendation 
}: RecommendationsDialogProps) {
  const styles = useStyles();
  
  const scoreText = `${monthlyResults.compliantWeeks} / ${monthlyResults.totalWeeks}`;
  const statusColor = recommendation.isCritical ? styles.critical : undefined;

  return (
    <Dialog open={isOpen} onOpenChange={(_event, data) => !data.open && onDismiss()}>
      <DialogSurface style={{ maxWidth: '500px' }}>
        <DialogBody>
          <DialogTitle action={<Button appearance="subtle" onClick={onDismiss} icon={<Comment24Regular />} aria-label="Close" />}>
            Automated Recommendation
          </DialogTitle>
          
          <Text size={500} weight="semibold">{agentName}'s Monthly Review</Text>
          <div className={styles.resultGrid}>
            <Text size={300}>**Compliant Weeks:**</Text>
            <Text size={300} weight="semibold">{scoreText}</Text>
            
            <Text size={300}>**Corrective Actions Logged:**</Text>
            <Text size={300} weight="semibold">{monthlyResults.actionCount}</Text>
          </div>

          <Card className={styles.notesContainer}>
            <CardHeader 
              header={<Text size={400} weight="bold">Suggested Action (Case A-E)</Text>}
              action={recommendation.isCritical ? <Warning24Regular className={statusColor} /> : undefined}
            />
            <Text size={500} className={statusColor}>
              {recommendation.action}
            </Text>
            <Text size={300} block style={{ marginTop: tokens.spacingVerticalS }}>
              Notes: {recommendation.notes}
            </Text>
          </Card>

          <DialogActions style={{ marginTop: tokens.spacingVerticalL }}>
            <Button appearance="secondary" onClick={onDismiss}>Close</Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}