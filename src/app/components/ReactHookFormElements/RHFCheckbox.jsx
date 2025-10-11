import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import { Controller } from 'react-hook-form';

const RHFCheckbox = ({
  control = null,
  name,
  label,
  defaultValue = false,
  sx = {},
  size = 'small',
  className = '',
  value,
  onChange,
  ...rest
}) => {
  return control ? (
    <Controller
      name={name}
      control={control}
      defaultValue={defaultValue}
      render={({ field }) => (
        <FormControlLabel
          className={className}
          sx={sx}
          control={
            <Checkbox
              {...field}
              checked={!!field.value}
              size={size}
              {...rest}
            />
          }
          label={label}
        />
      )}
    />
  ) : (
    <FormControlLabel
      className={className}
      sx={sx}
      control={
        <Checkbox
          checked={!!value}
          onChange={onChange}
          size={size}
          {...rest}
        />
      }
      label={label}
    />
  );
};

export default RHFCheckbox;
