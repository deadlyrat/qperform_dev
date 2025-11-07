// src/screens/performance/underperforming/RecommendationsDialog.tsx

import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  Button,
  Label,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  Person24Regular,
  CalendarMonth24Regular,
  CheckmarkCircle24Regular,
  CommentMultiple24Regular,
  Warning24Regular,
  Lightbulb24Regular,
} from "@fluentui/react-icons";
import { type AgentMonthlyResults, type Recommendation } from '../services/api';

// Modern styles matching TakeActionDialog
const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalL,
  },
  infoSection: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  infoRow: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    minHeight: '40px',
  },
  labelWithIcon: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    fontWeight: tokens.fontWeightSemibold,
    minWidth: '180px',
    color: tokens.colorNeutralForeground2,
  },
  valueText: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
  },
  recommendationBox: {
    padding: tokens.spacingVerticalL,
    borderRadius: tokens.borderRadiusMedium,
    border: `2px solid ${tokens.colorBrandBackground}`,
    backgroundColor: tokens.colorNeutralBackground2,
    boxShadow: tokens.shadow4,
    minHeight: '100px',
  },
  recommendationTitle: {
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: tokens.spacingVerticalS,
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    fontSize: tokens.fontSizeBase400,
  },
  recommendationAction: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    marginTop: tokens.spacingVerticalXS,
  },
  recommendationNotes: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    marginTop: tokens.spacingVerticalS,
    lineHeight: '1.5',
  },
  critical: {
    color: tokens.colorPaletteRedForeground1,
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: tokens.borderRadiusSmall,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: 'white',
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
  const isCritical = recommendation.isCritical;

  return (
    <Dialog open={isOpen} onOpenChange={(_event, data) => !data.open && onDismiss()}>
      <DialogSurface style={{ maxWidth: '600px' }}>
        <DialogBody>
          <DialogTitle>Performance Recommendation</DialogTitle>
          <p style={{ marginBottom: '16px', color: tokens.colorNeutralForeground2 }}>
            Automated recommendation based on monthly performance analysis and action history.
          </p>

          <div className={styles.root}>
            {/* Agent Information Section */}
            <div className={styles.infoSection}>
              <div className={styles.infoRow}>
                <Label className={styles.labelWithIcon}>
                  <Person24Regular />
                  Employee
                </Label>
                <span className={styles.valueText}>{agentName}</span>
              </div>

              <div className={styles.infoRow}>
                <Label className={styles.labelWithIcon}>
                  <CalendarMonth24Regular />
                  Compliant Weeks
                </Label>
                <span className={styles.valueText}>{scoreText}</span>
              </div>

              <div className={styles.infoRow}>
                <Label className={styles.labelWithIcon}>
                  <CommentMultiple24Regular />
                  Actions Logged
                </Label>
                <span className={styles.valueText}>{monthlyResults.actionCount}</span>
              </div>
            </div>

            {/* Recommendation Box */}
            <div className={styles.recommendationBox}>
              <div className={styles.recommendationTitle}>
                <Lightbulb24Regular />
                <span>Suggested Action</span>
                {isCritical && (
                  <span
                    className={styles.statusBadge}
                    style={{ backgroundColor: tokens.colorPaletteRedBackground3 }}
                  >
                    Critical
                  </span>
                )}
              </div>

              <div className={styles.recommendationAction} style={{ color: isCritical ? tokens.colorPaletteRedForeground1 : undefined }}>
                {recommendation.action}
              </div>

              {recommendation.notes && (
                <div className={styles.recommendationNotes}>
                  <strong>Notes:</strong> {recommendation.notes}
                </div>
              )}
            </div>
          </div>

          <DialogActions>
            <Button appearance="secondary" onClick={onDismiss}>Close</Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}