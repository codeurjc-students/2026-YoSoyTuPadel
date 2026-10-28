import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import toast from 'react-hot-toast';
import {
  coachService,
  type CoachCreateDetails,
} from '../../coaches/services/coachService';
import type { AuthUser } from '../../auth/services/authService';

interface CreateCoachDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (coach: AuthUser) => void;
}

const initialForm: CoachCreateDetails = {
  name: '',
  email: '',
  password: '',
  sessionPrice: 0,
  skillLevel: undefined,
};

function CreateCoachDialog({ open, onClose, onCreated }: CreateCoachDialogProps) {
  const [form, setForm] = useState(initialForm);
  const [image, setImage] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const nameIsValid = form.name.trim().length >= 4;
  const passwordIsValid = form.password.length >= 8;
  const priceIsValid = Number.isFinite(form.sessionPrice) && form.sessionPrice >= 0;
  const skillLevelIsValid = form.skillLevel === 1 || form.skillLevel === 2 || form.skillLevel === 3;
  const formIsValid = nameIsValid && emailIsValid && passwordIsValid && priceIsValid && skillLevelIsValid;

  const updateForm = <K extends keyof CoachCreateDetails>(field: K, value: CoachCreateDetails[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleClose = () => {
    if (!isSaving) {
      setForm(initialForm);
      setImage(null);
      onClose();
    }
  };

  const handleSave = async () => {
    if (!formIsValid) return;

    setIsSaving(true);
    try {
      const createdCoach = await coachService.createCoach({
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
      }, image);
      onCreated(createdCoach);
      toast.success('Entrenador creado correctamente.');
      setForm(initialForm);
      setImage(null);
      onClose();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'No se pudo crear el entrenador.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      slotProps={{ paper: { sx: { bgcolor: 'white', color: 'grey.900', borderRadius: 3 } } }}
    >
      <DialogTitle sx={{ color: 'grey.900', fontWeight: 900 }}>Añadir entrenador</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label="Nombre"
            value={form.name}
            onChange={(event) => updateForm('name', event.target.value)}
            error={form.name.length > 0 && !nameIsValid}
            helperText={nameIsValid ? '' : 'Mínimo 4 caracteres.'}
            fullWidth
          />
          <TextField
            label="Email"
            type="email"
            value={form.email}
            onChange={(event) => updateForm('email', event.target.value)}
            error={form.email.length > 0 && !emailIsValid}
            helperText={emailIsValid ? '' : 'Introduce un correo válido.'}
            fullWidth
          />
          <TextField
            label="Contraseña"
            type="password"
            value={form.password}
            onChange={(event) => updateForm('password', event.target.value)}
            error={form.password.length > 0 && !passwordIsValid}
            helperText={passwordIsValid ? '' : 'Mínimo 8 caracteres.'}
            fullWidth
          />
          <TextField
            label="Precio por sesión"
            type="number"
            value={form.sessionPrice}
            onChange={(event) => updateForm('sessionPrice', Number(event.target.value))}
            error={!priceIsValid}
            helperText={priceIsValid ? '' : 'Debe ser un precio igual o superior a 0.'}
            slotProps={{
              input: { startAdornment: <InputAdornment position="start">€</InputAdornment> },
              htmlInput: { min: 0, step: 0.01 },
            }}
            fullWidth
          />
          <TextField
            select
            required
            label="Nivel de certificación"
            value={form.skillLevel ?? ''}
            onChange={(event) => updateForm('skillLevel', Number(event.target.value))}
            error={!skillLevelIsValid}
            helperText={skillLevelIsValid ? '' : 'Selecciona un nivel del 1 al 3.'}
            fullWidth
          >
            {[1, 2, 3].map((level) => (
              <MenuItem key={level} value={level}>Nivel {level}</MenuItem>
            ))}
          </TextField>
          <Button component="label" variant="outlined" sx={{ alignSelf: 'flex-start' }}>
            {image ? image.name : 'Adjuntar imagen (opcional)'}
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={(event) => setImage(event.target.files?.[0] ?? null)}
            />
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={isSaving} sx={{ color: 'grey.700', textTransform: 'none' }}>
          Volver
        </Button>
        <Button
          onClick={() => void handleSave()}
          disabled={isSaving || !formIsValid}
          variant="contained"
          color="error"
          sx={{ fontWeight: 800, textTransform: 'uppercase' }}
        >
          GUARDAR
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CreateCoachDialog;
