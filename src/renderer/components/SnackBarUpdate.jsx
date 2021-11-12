import React, {useEffect} from 'react';

import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import './SnackBarUpdate.css';

export default function SimpleSnackbar() {

  const [open, setOpen] = React.useState(false);
  const [showLink, setShowLink] = React.useState(false);
  const [message, setMessage] = React.useState("");

  useEffect(() => {

    window.electron.ipcRenderer.once('update_available', () => {
      setMessage('A new update is available.');
      setShowLink(true);
      setOpen(true);
    });

  }, []);

  const goToSite = () => {
    window.electron.ipcRenderer.openWebsite();
  };

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  return (
    <Snackbar
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      open={open}
      onClose={handleClose}
      message={message}
      action={
        <React.Fragment>
          <Button color="secondary" size="small" onClick={goToSite} className={showLink? "": "hide"}>
            Go to site
          </Button>
          <IconButton size="small" aria-label="close" color="inherit" onClick={handleClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </React.Fragment>
      }
    />
  );
}
