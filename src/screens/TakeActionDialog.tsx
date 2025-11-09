// src/screens/performance/underperforming/TakeActionDialog.tsx

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  Button,
  Dropdown,
  Option,
  Textarea,
  Label,
  makeStyles,
  tokens,
  MessageBar,
  MessageBarBody,
  Spinner,
} from "@fluentui/react-components";
import {
  Person24Regular,
  CalendarLtr24Regular,
  ChartMultiple24Regular,
  Warning24Regular,
  NoteEdit24Regular,
} from "@fluentui/react-icons";
import {
  generateRecommendation,
  createWarning,
  type Recommendation,
  type WarningType,
  getCaseDescription,
  getPriorityColor,
} from '../services/warningService';
import { checkDuplicateAction, deleteAction } from '../services/api';

// Modern styles with fixed dimensions
const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalL,
  },
  formField: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
    minHeight: '70px', // Fixed minimum height for consistency
  },
  dropdownWrapper: {
    width: '100%',
    minWidth: '100%',
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
    fontSize: tokens.fontSizeBase300,
  },
  recommendationDetails: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    marginTop: tokens.spacingVerticalXS,
    lineHeight: '1.5',
  },
  priorityBadge: {
    padding: '4px 12px',
    borderRadius: tokens.borderRadiusSmall,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: 'white',
  },
  labelWithIcon: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    fontWeight: tokens.fontWeightSemibold,
  },
});

type TakeActionDialogProps = {
  isOpen: boolean;
  onDismiss: () => void;
  employees: { id: string; name: string; email: string }[]; // Now includes email
  weekRanges?: { start_date: string; end_date: string; week_range: string }[]; // Available week ranges
  preSelectedEmployee?: string; // Pre-select an employee
  preSelectedWeek?: { start_date: string; end_date: string }; // Pre-select a week
  onActionSuccess: () => void; // Callback for successful action submission
};

export default function TakeActionDialog({
  isOpen,
  onDismiss,
  employees,
  weekRanges = [],
  preSelectedEmployee,
  preSelectedWeek,
  onActionSuccess,
}: TakeActionDialogProps) {
  const styles = useStyles();

  // Form state
  const [selectedEmployee, setSelectedEmployee] = useState<string>(preSelectedEmployee || '');
  const [selectedWeekRange, setSelectedWeekRange] = useState<string>('');
  const [selectedMetricType, setSelectedMetricType] = useState<'Production' | 'QA'>('QA');
  const [actionType, setActionType] = useState<WarningType | ''>('');
  const [actionNotes, setActionNotes] = useState('');

  // Recommendation state
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingAction, setExistingAction] = useState<any>(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedEmployee(preSelectedEmployee || '');
      if (preSelectedWeek) {
        setSelectedWeekRange(`${preSelectedWeek.start_date}_${preSelectedWeek.end_date}`);
      }
    } else {
      // Reset on close
      setSelectedEmployee('');
      setSelectedWeekRange('');
      setActionType('');
      setActionNotes('');
      setRecommendation(null);
      setRecommendationError(null);
    }
  }, [isOpen, preSelectedEmployee, preSelectedWeek]);

  // Generate recommendation when employee and week are selected
  useEffect(() => {
    async function fetchRecommendation() {
      if (!selectedEmployee || !selectedWeekRange) {
        setRecommendation(null);
        return;
      }

      const employee = employees.find(e => e.id === selectedEmployee);
      if (!employee?.email) return;

      const [startDate, endDate] = selectedWeekRange.split('_');

      setIsLoadingRecommendation(true);
      setRecommendationError(null);

      try {
        const rec = await generateRecommendation(
          employee.email,
          selectedMetricType,
          new Date(startDate),
          new Date(endDate)
        );

        setRecommendation(rec);

        // Auto-fill action type based on recommendation
        if (rec.recommendation_type && rec.recommendation_type.includes('Verbal')) {
          setActionType('Verbal');
        } else if (rec.recommendation_type && rec.recommendation_type.includes('Written')) {
          setActionType('Written');
        } else if (rec.recommendation_type && rec.recommendation_type.includes('Coaching')) {
          setActionType('Coaching');
        }

      } catch (error) {
        console.error('Error fetching recommendation:', error);
        setRecommendationError('Failed to generate recommendation. Please try again.');
        setRecommendation(null);
      } finally {
        setIsLoadingRecommendation(false);
      }
    }

    fetchRecommendation();
  }, [selectedEmployee, selectedWeekRange, selectedMetricType, employees]);

  const handleSubmit = async () => {
    if (!selectedEmployee || !actionType || !actionNotes || !selectedWeekRange) {
      alert('Please fill in all required fields');
      return;
    }

    const employee = employees.find(e => e.id === selectedEmployee);
    if (!employee) return;

    const [startDate, endDate] = selectedWeekRange.split('_');

    setIsSubmitting(true);

    try {
      // Check for duplicate action
      const duplicateCheck = await checkDuplicateAction(
        employee.email,
        new Date(startDate),
        new Date(endDate)
      );

      if (duplicateCheck.exists) {
        setExistingAction(duplicateCheck.action);
        setShowDuplicateWarning(true);
        setIsSubmitting(false);
        return;
      }

      // Create warning
      await createWarning({
        agentId: employee.id,
        agentEmail: employee.email,
        agentName: employee.name,
        warningType: actionType as WarningType,
        metricType: selectedMetricType,
        issuedBy: 'Current User', // TODO: Get from auth context
        notes: actionNotes,
        weekStartDate: new Date(startDate),
        weekEndDate: new Date(endDate),
      });

      onActionSuccess();
      onDismiss();
    } catch (error) {
      console.error('Error creating warning:', error);
      alert('Failed to create warning. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExisting = async () => {
    if (!existingAction) return;

    setIsSubmitting(true);
    try {
      await deleteAction(existingAction.id);
      setShowDuplicateWarning(false);
      setExistingAction(null);
      alert('Previous action deleted. You can now submit a new action.');
      onActionSuccess(); // Refresh the data
    } catch (error) {
      console.error('Error deleting action:', error);
      alert('Failed to delete action. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(_event, data) => !data.open && onDismiss()}>
      <DialogSurface style={{ maxWidth: '600px' }}>
        <DialogBody>
          <DialogTitle>Take Action</DialogTitle>
          <p style={{ marginBottom: '16px', color: tokens.colorNeutralForeground2 }}>
            Document and record a performance action for an employee or client.
          </p>

          <div className={styles.root}>
            <div className={styles.formField}>
              <Label required className={styles.labelWithIcon}>
                <Person24Regular />
                Select Employee
              </Label>
              <div className={styles.dropdownWrapper}>
                <Dropdown
                  placeholder="Select employee"
                  value={employees.find(e => e.id === selectedEmployee)?.name || ''}
                  onOptionSelect={(_, data) => setSelectedEmployee(data.optionValue || '')}
                  style={{ width: '100%' }}
                >
                  {(employees || []).map(emp => (
                    <Option key={emp.id} value={emp.id}>{emp.name}</Option>
                  ))}
                </Dropdown>
              </div>
            </div>

            <div className={styles.formField}>
              <Label required className={styles.labelWithIcon}>
                <CalendarLtr24Regular />
                Week Range
              </Label>
              <div className={styles.dropdownWrapper}>
                <Dropdown
                  placeholder="Select week range"
                  value={weekRanges.find(w => `${w.start_date}_${w.end_date}` === selectedWeekRange)?.week_range || ''}
                  onOptionSelect={(_, data) => setSelectedWeekRange(data.optionValue || '')}
                  style={{ width: '100%' }}
                >
                  {weekRanges.map(week => (
                    <Option
                      key={`${week.start_date}_${week.end_date}`}
                      value={`${week.start_date}_${week.end_date}`}
                    >
                      {week.week_range}
                    </Option>
                  ))}
                </Dropdown>
              </div>
            </div>

            <div className={styles.formField}>
              <Label required className={styles.labelWithIcon}>
                <ChartMultiple24Regular />
                Metric Type
              </Label>
              <div className={styles.dropdownWrapper}>
                <Dropdown
                  placeholder="Select metric type"
                  value={selectedMetricType}
                  onOptionSelect={(_, data) => setSelectedMetricType(data.optionValue as 'Production' | 'QA')}
                  style={{ width: '100%' }}
                >
                  <Option value="QA">Quality Assurance (QA)</Option>
                  <Option value="Production">Production</Option>
                </Dropdown>
              </div>
            </div>

            {/* Recommendation Display */}
            {isLoadingRecommendation && (
              <MessageBar intent="info">
                <MessageBarBody>
                  <Spinner size="tiny" style={{ marginRight: '8px' }} />
                  Analyzing warning history and generating recommendation...
                </MessageBarBody>
              </MessageBar>
            )}

            {recommendationError && (
              <MessageBar intent="error">
                <MessageBarBody>{recommendationError}</MessageBarBody>
              </MessageBar>
            )}

            {showDuplicateWarning && existingAction && (
              <MessageBar intent="warning">
                <MessageBarBody>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <strong>Action Already Exists for This Week</strong>
                    <div style={{ fontSize: '0.9em' }}>
                      An action was already logged for this employee on this week:
                      <br />
                      <strong>Type:</strong> {existingAction.action_type}
                      <br />
                      <strong>Description:</strong> {existingAction.description}
                      <br />
                      <strong>Logged by:</strong> {existingAction.taken_by} on{' '}
                      {new Date(existingAction.action_date).toLocaleDateString()}
                    </div>
                    <div style={{ marginTop: '8px' }}>
                      <Button
                        appearance="secondary"
                        size="small"
                        onClick={handleDeleteExisting}
                        disabled={isSubmitting}
                      >
                        Delete Existing Action
                      </Button>
                      <Button
                        appearance="subtle"
                        size="small"
                        onClick={() => setShowDuplicateWarning(false)}
                        style={{ marginLeft: '8px' }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </MessageBarBody>
              </MessageBar>
            )}

            {recommendation && !isLoadingRecommendation && (
              <div className={styles.recommendationBox}>
                <div className={styles.recommendationTitle}>
                  <span>📋 Recommended Action</span>
                  <span
                    className={styles.priorityBadge}
                    style={{ backgroundColor: getPriorityColor(recommendation.priority) }}
                  >
                    {recommendation.priority}
                  </span>
                </div>
                <div style={{ fontSize: tokens.fontSizeBase300, fontWeight: tokens.fontWeightSemibold }}>
                  {recommendation.recommendation_type}
                </div>
                <div className={styles.recommendationDetails}>
                  {getCaseDescription(recommendation.case)}
                </div>
                <div className={styles.recommendationDetails} style={{ marginTop: tokens.spacingVerticalS }}>
                  {recommendation.recommendation_text}
                </div>
              </div>
            )}

            <div className={styles.formField}>
              <Label required className={styles.labelWithIcon}>
                <Warning24Regular />
                Action Type
                {recommendation && actionType && (
                  <span style={{
                    marginLeft: '8px',
                    fontSize: '0.75rem',
                    color: tokens.colorBrandBackground,
                    fontWeight: 'normal'
                  }}>
                    (Recommended: {actionType})
                  </span>
                )}
              </Label>
              <div className={styles.dropdownWrapper}>
                <Dropdown
                  placeholder="Select action type"
                  value={actionType}
                  selectedOptions={actionType ? [actionType] : []}
                  onOptionSelect={(_, data) => setActionType(data.optionValue as WarningType)}
                  style={{ width: '100%' }}
                >
                  <Option value="Verbal">
                    Verbal Warning
                    {recommendation?.recommendation_type?.includes('Verbal') && ' ⭐ Recommended'}
                  </Option>
                  <Option value="Written">
                    Written Warning
                    {recommendation?.recommendation_type?.includes('Written') && ' ⭐ Recommended'}
                  </Option>
                  <Option value="Coaching">
                    Coaching/Reinforcement
                    {recommendation?.recommendation_type?.includes('Coaching') && !recommendation?.recommendation_type?.includes('Verbal') && ' ⭐ Recommended'}
                  </Option>
                </Dropdown>
              </div>
            </div>

            <div className={styles.formField} style={{ minHeight: '150px' }}>
              <Label required className={styles.labelWithIcon}>
                <NoteEdit24Regular />
                Action Notes
              </Label>
              <Textarea
                placeholder="Provide detailed notes about this action, including context, observations, and expected outcomes..."
                value={actionNotes}
                onChange={(_, data) => setActionNotes(data.value)}
                style={{ minHeight: "120px", width: '100%' }}
                resize="vertical"
              />
            </div>
          </div>

          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary" onClick={onDismiss} disabled={isSubmitting}>
                Cancel
              </Button>
            </DialogTrigger>
            <Button
              appearance="primary"
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedEmployee || !actionType || !actionNotes || !selectedWeekRange}
            >
              {isSubmitting ? <Spinner size="tiny" /> : 'Submit Action'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}