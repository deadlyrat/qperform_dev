// src/screens/performance/underperforming/TakeActionDialog.tsx

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
} from "@fluentui/react-components";

// Simple styles for spacing
const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
});

type TakeActionDialogProps = {
  isOpen: boolean;
  onDismiss: () => void;
  employees: { id: string; name: string }[]; // Pass employee list for the dropdown
  onActionSuccess: () => void; // Callback for successful action submission
};

export default function TakeActionDialog({ isOpen, onDismiss, employees }: TakeActionDialogProps) {
  const styles = useStyles();

  const handleSubmit = () => {
    // In a real app, you would gather the form data and send it to your API
    console.log("Submit action clicked!");
    onDismiss(); // Close the dialog after submission
  };

  return (
    <Dialog open={isOpen} onOpenChange={(_event, data) => !data.open && onDismiss()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Take Action</DialogTitle>
          <p>Document and record a performance action for an employee or client.</p>
          
          <div className={styles.root}>
            <div>
              <Label required>Action Type</Label>
              <Dropdown placeholder="Select action type">
                <Option value="coaching">Coaching</Option>
                <Option value="written_warning">Written Warning</Option>
                <Option value="final_warning">Final Warning</Option>
              </Dropdown>
            </div>

            <div>
              <Label required>Target Type</Label>
              <Dropdown placeholder="Select target type" defaultValue="Employee" selectedOptions={["employee"]}>
                <Option value="employee">Employee</Option>
                <Option value="client" disabled>Client (coming soon)</Option>
              </Dropdown>
            </div>
            
            <div>
              <Label required>Select Employee</Label>
              <Dropdown placeholder="Select employee">
                {/* FIX: Ensure employees is defined before calling map() */}
                {employees && employees.map(emp => ( 
                  <Option key={emp.id} value={emp.id}>{emp.name}</Option>
                ))}
              </Dropdown>
            </div>

            <div>
              <Label required>Action Notes</Label>
              <Textarea
                placeholder="Provide detailed notes about this action, including context, observations, and expected outcomes..."
                style={{ minHeight: "120px" }}
              />
            </div>
          </div>

          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary" onClick={onDismiss}>Cancel</Button>
            </DialogTrigger>
            <Button appearance="primary" onClick={handleSubmit}>Submit Action</Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}