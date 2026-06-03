import Swal, { type SweetAlertOptions } from 'sweetalert2'

export function isAppDarkMode(): boolean {
  return document.documentElement.classList.contains('dark')
}

function themedOptions(overrides: SweetAlertOptions): SweetAlertOptions {
  const dark = isAppDarkMode()
  const extraClass =
    typeof overrides.customClass === 'object' && overrides.customClass !== null
      ? overrides.customClass
      : {}

  return {
    theme: dark ? 'dark' : 'light',
    buttonsStyling: true,
    ...overrides,
    customClass: {
      ...extraClass,
      popup: ['gestion-ops-swal', extraClass.popup].filter(Boolean).join(' '),
    },
  }
}

export function showConfirmAlert(
  title: string,
  text: string,
  confirmText = 'Confirmer',
) {
  return Swal.fire(
    themedOptions({
      icon: 'warning',
      title,
      text,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: 'Annuler',
      customClass: {
        popup: 'gestion-ops-swal--danger',
      },
    }),
  )
}

export function showErrorAlert(title: string, text?: string) {
  return Swal.fire(
    themedOptions({
      icon: 'error',
      title,
      text,
      confirmButtonText: 'OK',
    }),
  )
}

export function showSuccessAlert(title: string, text?: string) {
  return Swal.fire(
    themedOptions({
      icon: 'success',
      title,
      text,
      confirmButtonText: 'OK',
      timer: 2200,
      timerProgressBar: true,
    }),
  )
}
