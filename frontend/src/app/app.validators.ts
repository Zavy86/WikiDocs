import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';

export const matchingFieldsErrorStateMatcher: ErrorStateMatcher = {
  isErrorState(control: AbstractControl | null): boolean {
    return Boolean(control !== null && control.touched && (control.invalid || control.parent?.hasError('fieldsIncomplete') || control.parent?.hasError('fieldsMismatch')));
  },
};

export function matchingFieldsValidator(firstField:string, secondField:string):ValidatorFn {
  return (control:AbstractControl):ValidationErrors | null => {
    const firstValue:unknown = control.get(firstField)?.value;
    const secondValue:unknown = control.get(secondField)?.value;
    if ( typeof firstValue !== 'string' || typeof secondValue !== 'string' ) { return null; }
    const firstIsEmpty:boolean = firstValue.length === 0;
    const secondIsEmpty:boolean = secondValue.length === 0;
    if ( firstIsEmpty && secondIsEmpty ) { return null; }
    if ( firstIsEmpty || secondIsEmpty ) { return { fieldsIncomplete: true }; }
    return ( firstValue === secondValue ? null : { fieldsMismatch: true } );
  };
}
