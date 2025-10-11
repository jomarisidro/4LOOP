import TextField from '@mui/material/TextField';
import { Controller } from "react-hook-form";

const RHFTextField = ({
  control,
  name,
  label,
  placeholder,
  error,
  helperText,
  variant="outlined",
  type="text",
  size="normal"
}) => {
  return (
    <Controller
      name={name}
      control={control}
      defaultValue={""}
      render={({field}) => <TextField
          {...field}
          className={`textArea `}
          label={label}
          variant={variant}
          placeholder={placeholder}
          error={error}
          type={type}
          sx={{ width: '100%' }}
          helperText={helperText}
          size={size}
      />
  }/>
  );
};
export default RHFTextField;