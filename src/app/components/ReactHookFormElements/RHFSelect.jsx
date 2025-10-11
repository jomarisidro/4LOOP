import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import { Controller } from "react-hook-form";
import FormHelperText from '@mui/material/FormHelperText';

const RHFSelect = ({
  name,
  label,
  control,
  defaultValue,
  error,
  errors,
  children,
  size="small",
  sx,
  ...props
}) => {
  const labelId = `${name}-label`;
  return (
    <FormControl {...props} error={error} size={size}>
      <InputLabel id={labelId}>{label}</InputLabel>
      <Controller
        name={name}
        control={control}
        defaultValue={defaultValue}
        render={({field})=>{
          return <Select 
                {...field}
                defaultValue={defaultValue}
                labelId={labelId}
                label={label}
                sx={sx}
                >
                    {children}
                </Select>
        }}
      />
      {error ? <FormHelperText>{error?.message}</FormHelperText> : ""}
    </FormControl>
  );
};
export default RHFSelect;