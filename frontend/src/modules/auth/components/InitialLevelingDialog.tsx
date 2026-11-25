import {
    Box,
    Button,
    Dialog,
    DialogContent,
    Radio,
    Stack,
    Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { INITIAL_LEVELING_QUESTIONS } from '../constants/levelingQuestions';

interface InitialLevelingDialogProps {
    open: boolean;
    isSubmitting: boolean;
    onCancel: () => void;
    onComplete: (firstTimePlayer: boolean, levelingAnswers?: number[]) => Promise<void>;
}

type LevelingStep = 'first-time-check' | 'questionnaire';

interface OptionCardProps {
    selected: boolean;
    label: string;
    description?: string;
    value: string;
    name: string;
    disabled?: boolean;
    onSelect: () => void;
}

function SelectableOptionCard({
                                  selected,
                                  label,
                                  description,
                                  value,
                                  name,
                                  disabled = false,
                                  onSelect,
                              }: Readonly<OptionCardProps>) {
    return (
        <Box
            component="label"
            onClick={() => {
                if (!disabled) {
                    onSelect();
                }
            }}
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1.5,
                px: { xs: 2, sm: 2.5 },
                py: { xs: 1.5, sm: 1.85 },
                borderRadius: 3.5,
                border: '2px solid',
                borderColor: selected ? '#e60012' : 'grey.200',
                bgcolor: selected ? 'rgba(230, 0, 18, 0.04)' : 'common.white',
                cursor: disabled ? 'default' : 'pointer',
                transition: 'border-color 0.18s ease, background-color 0.18s ease, transform 0.12s ease',
                '&:hover': disabled
                    ? {}
                    : {
                        borderColor: selected ? '#e60012' : 'grey.400',
                        bgcolor: selected ? 'rgba(230, 0, 18, 0.05)' : 'grey.50',
                    },
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                <Radio
                    name={name}
                    value={value}
                    checked={selected}
                    disabled={disabled}
                    onChange={onSelect}
                    size="small"
                    sx={{
                        p: 0.25,
                        color: 'grey.300',
                        '&.Mui-checked': { color: '#e60012' },
                    }}
                />
                <Box>
                    <Typography
                        sx={{
                            fontSize: { xs: 14, sm: 15 },
                            fontWeight: selected ? 800 : 700,
                            color: selected ? '#e60012' : 'grey.900',
                            lineHeight: 1.4,
                        }}
                    >
                        {label}
                    </Typography>
                    {description && (
                        <Typography sx={{ mt: 0.35, fontSize: 12.5, color: 'text.secondary' }}>
                            {description}
                        </Typography>
                    )}
                </Box>
            </Box>

            {selected && (
                <Typography
                    aria-hidden="true"
                    sx={{ color: '#e60012', fontWeight: 900, fontSize: 16, flexShrink: 0 }}
                >
                    ✓
                </Typography>
            )}
        </Box>
    );
}

export function InitialLevelingDialog({
                                          open,
                                          isSubmitting,
                                          onCancel,
                                          onComplete,
                                      }: Readonly<InitialLevelingDialogProps>) {
    const [step, setStep] = useState<LevelingStep>('first-time-check');
    const [firstTimeSelection, setFirstTimeSelection] = useState<'yes' | 'no' | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<(number | null)[]>(() =>
        INITIAL_LEVELING_QUESTIONS.map(() => null),
    );

    // Reset wizard state every time the dialog opens or closes
    useEffect(() => {
        setStep('first-time-check');
        setFirstTimeSelection(null);
        setCurrentQuestionIndex(0);
        setAnswers(INITIAL_LEVELING_QUESTIONS.map(() => null));
    }, [open]);

    const totalQuestions = INITIAL_LEVELING_QUESTIONS.length;
    const currentQuestion = INITIAL_LEVELING_QUESTIONS[currentQuestionIndex];
    const currentAnswer = answers[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

    const progressPercentage =
        step === 'first-time-check'
            ? 0
            : ((currentQuestionIndex + 1) / totalQuestions) * 100;

    const handleFirstTimeContinue = () => {
        if (!firstTimeSelection || isSubmitting) {
            return;
        }
        if (firstTimeSelection === 'yes') {
            void onComplete(true);
            return;
        }
        setStep('questionnaire');
    };

    const handleSelectOption = (score: number) => {
        setAnswers((previous) =>
            previous.map((value, index) => (index === currentQuestionIndex ? score : value)),
        );
    };

    const handleNextOrFinish = () => {
        if (currentAnswer === null || isSubmitting) {
            return;
        }

        if (!isLastQuestion) {
            setCurrentQuestionIndex((index) => index + 1);
            return;
        }

        const validAnswers = answers.filter((answer): answer is number => answer !== null);
        if (validAnswers.length === totalQuestions) {
            void onComplete(false, validAnswers);
        }
    };

    const handlePreviousQuestion = () => {
        if (isSubmitting) {
            return;
        }
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex((index) => index - 1);
        } else {
            setStep('first-time-check');
        }
    };

    return (
        <Dialog
            open={open}
            onClose={(_event, reason) => {
                if (reason !== 'backdropClick' && reason !== 'escapeKeyDown' && !isSubmitting) {
                    onCancel();
                }
            }}
            aria-labelledby="initial-leveling-dialog-title"
            fullWidth
            maxWidth={step === 'first-time-check' ? 'sm' : 'md'}
            slotProps={{
                paper: {
                    sx: {
                        borderRadius: 4,
                        overflow: 'hidden',
                        bgcolor: '#fafafa',
                    },
                },
            }}
        >
            {/* Branded header with step counter */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: { xs: 2.5, sm: 4 },
                    py: 2,
                    bgcolor: 'common.white',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                    <Box
                        sx={{
                            width: 36,
                            height: 36,
                            display: 'grid',
                            placeItems: 'center',
                            borderRadius: 2.5,
                            bgcolor: '#e60012',
                            color: 'common.white',
                            fontSize: 10,
                            fontWeight: 900,
                            letterSpacing: 0.8,
                        }}
                    >
                        YSTP
                    </Box>
                    <Box>
                        <Typography sx={{ fontWeight: 900, letterSpacing: 2, fontSize: 12, color: 'grey.900' }}>
                            YOSOYTUPADEL
                        </Typography>
                        <Typography
                            sx={{
                                color: '#e60012',
                                fontWeight: 800,
                                letterSpacing: 2,
                                fontSize: 8,
                                textTransform: 'uppercase',
                            }}
                        >
                            Academia · App
                        </Typography>
                    </Box>
                </Box>

                {step === 'questionnaire' && (
                    <Typography sx={{ fontWeight: 900, fontSize: 14, color: 'grey.700' }}>
                        {currentQuestionIndex + 1}
                        <Box component="span" sx={{ color: '#e60012' }}>
                            /{totalQuestions}
                        </Box>
                    </Typography>
                )}
            </Box>

            {/* Top progress bar */}
            <Box sx={{ width: '100%', height: 4, bgcolor: 'grey.200' }}>
                <Box
                    sx={{
                        width: `${progressPercentage}%`,
                        height: '100%',
                        bgcolor: '#e60012',
                        transition: 'width 0.25s ease',
                    }}
                />
            </Box>

            <DialogContent sx={{ px: { xs: 2.5, sm: 5 }, py: { xs: 3.5, sm: 4.5 } }}>
                {step === 'first-time-check' ? (
                    <Box>
                        <Typography
                            sx={{
                                textAlign: 'center',
                                color: '#e60012',
                                fontWeight: 900,
                                fontSize: 11,
                                letterSpacing: 2.5,
                                textTransform: 'uppercase',
                            }}
                        >
                            Nivelación inicial
                        </Typography>
                        <Typography
                            id="initial-leveling-dialog-title"
                            component="h2"
                            sx={{
                                mt: 1.5,
                                mb: 3.5,
                                textAlign: 'center',
                                fontWeight: 900,
                                fontSize: { xs: 24, sm: 30 },
                                lineHeight: 1.15,
                                letterSpacing: -0.6,
                                color: 'grey.900',
                            }}
                        >
                            Antes de crear tu cuenta ¿Es la primera vez que juegas al padel?
                        </Typography>

                        <Stack spacing={1.5} role="radiogroup" aria-label="Experiencia previa en pádel">
                            <SelectableOptionCard
                                name="first-time-player"
                                value="yes"
                                selected={firstTimeSelection === 'yes'}
                                label="Sí, es mi primera vez"
                                description="Empezarás con el nivel mínimo"
                                disabled={isSubmitting}
                                onSelect={() => setFirstTimeSelection('yes')}
                            />
                            <SelectableOptionCard
                                name="first-time-player"
                                value="no"
                                selected={firstTimeSelection === 'no'}
                                label="No, ya he jugado antes"
                                description="Necesitaremos hacerte una serie de preguntas para asignarte un nivel"
                                disabled={isSubmitting}
                                onSelect={() => setFirstTimeSelection('no')}
                            />
                        </Stack>

                        <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1.5} sx={{ mt: 4 }}>
                            <Button
                                type="button"
                                variant="outlined"
                                color="inherit"
                                disabled={isSubmitting}
                                onClick={onCancel}
                                sx={{
                                    py: 1.5,
                                    px: 3,
                                    borderRadius: 3,
                                    borderColor: 'grey.300',
                                    bgcolor: 'common.white',
                                    color: 'text.secondary',
                                    fontWeight: 800,
                                    textTransform: 'none',
                                    flexShrink: 0,
                                }}
                            >
                                Cancelar registro
                            </Button>
                            <Button
                                type="button"
                                variant="contained"
                                color="error"
                                fullWidth
                                disabled={firstTimeSelection === null || isSubmitting}
                                onClick={handleFirstTimeContinue}
                                sx={{
                                    py: 1.5,
                                    borderRadius: 3,
                                    bgcolor: '#e60012',
                                    fontWeight: 900,
                                    letterSpacing: 0.8,
                                    boxShadow: '0 8px 20px rgba(230,0,18,.25)',
                                    '&:hover': { bgcolor: '#c4000f' },
                                }}
                            >
                                {isSubmitting
                                    ? 'Creando cuenta…'
                                    : firstTimeSelection === 'yes'
                                        ? 'FINALIZAR REGISTRO'
                                        : 'CONTINUAR →'}
                            </Button>
                        </Stack>
                    </Box>
                ) : (
                    <Box>
                        <Typography
                            sx={{
                                textAlign: 'center',
                                color: '#e60012',
                                fontWeight: 900,
                                fontSize: 11,
                                letterSpacing: 2.5,
                                textTransform: 'uppercase',
                            }}
                        >
                            Pregunta {currentQuestionIndex + 1} de {totalQuestions}
                        </Typography>
                        <Typography
                            id="initial-leveling-dialog-title"
                            component="h2"
                            sx={{
                                mt: 1.5,
                                mb: 3.5,
                                textAlign: 'center',
                                fontWeight: 900,
                                fontSize: { xs: 23, sm: 29 },
                                lineHeight: 1.15,
                                letterSpacing: -0.6,
                                color: 'grey.900',
                            }}
                        >
                            {currentQuestion.title}
                        </Typography>

                        <Stack spacing={1.5} role="radiogroup" aria-label={currentQuestion.title}>
                            {currentQuestion.options.map((option) => (
                                <SelectableOptionCard
                                    key={option.score}
                                    name={currentQuestion.id}
                                    value={String(option.score)}
                                    selected={currentAnswer === option.score}
                                    label={option.label}
                                    disabled={isSubmitting}
                                    onSelect={() => handleSelectOption(option.score)}
                                />
                            ))}
                        </Stack>

                        {/* Bottom action buttons */}
                        <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1.5} sx={{ mt: 4 }}>
                            <Button
                                type="button"
                                variant="outlined"
                                color="inherit"
                                disabled={isSubmitting}
                                onClick={onCancel}
                                sx={{
                                    py: 1.5,
                                    px: 3,
                                    borderRadius: 3,
                                    borderColor: 'grey.300',
                                    bgcolor: 'common.white',
                                    color: 'text.secondary',
                                    fontWeight: 800,
                                    textTransform: 'none',
                                    flexShrink: 0,
                                }}
                            >
                                Cancelar registro
                            </Button>
                            <Button
                                type="button"
                                variant="contained"
                                color="error"
                                fullWidth
                                disabled={currentAnswer === null || isSubmitting}
                                onClick={handleNextOrFinish}
                                sx={{
                                    py: 1.5,
                                    borderRadius: 3,
                                    bgcolor: '#e60012',
                                    fontWeight: 900,
                                    letterSpacing: 0.8,
                                    boxShadow: '0 8px 20px rgba(230,0,18,.25)',
                                    '&:hover': { bgcolor: '#c4000f' },
                                }}
                            >
                                {isSubmitting
                                    ? 'Creando cuenta…'
                                    : isLastQuestion
                                        ? 'FINALIZAR REGISTRO'
                                        : 'SIGUIENTE PREGUNTA →'}
                            </Button>
                        </Stack>

                        {/* Step indicator dots and back navigation */}
                        <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.9 }}>
                                {INITIAL_LEVELING_QUESTIONS.map((question, index) => {
                                    const isCurrent = index === currentQuestionIndex;
                                    const isCompleted = index < currentQuestionIndex;
                                    let dotBgColor = 'grey.300';
                                    if (isCurrent) {
                                        dotBgColor = '#e60012';
                                    } else if (isCompleted) {
                                        dotBgColor = 'rgba(230, 0, 18, 0.35)';
                                    }

                                    return (
                                        <Box
                                            key={question.id}
                                            sx={{
                                                width: isCurrent ? 24 : 7,
                                                height: 7,
                                                borderRadius: 99,
                                                bgcolor: dotBgColor,
                                                transition: 'all 0.22s ease',
                                            }}
                                        />
                                    );
                                })}
                            </Box>

                            <Button
                                type="button"
                                size="small"
                                color="inherit"
                                disabled={isSubmitting}
                                onClick={handlePreviousQuestion}
                                sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 700, textTransform: 'none' }}
                            >
                                ← Anterior
                            </Button>
                        </Box>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
}