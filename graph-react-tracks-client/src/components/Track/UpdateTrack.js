import React, { useState, useContext } from "react";
import { Mutation } from 'react-apollo';
import { gql } from 'apollo-boost';
import axios from 'axios';
import withStyles from "@material-ui/core/styles/withStyles";
import IconButton from "@material-ui/core/IconButton";
import EditIcon from "@material-ui/icons/Edit";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import FormControl from "@material-ui/core/FormControl";
import FormHelperText from "@material-ui/core/FormHelperText";
import DialogTitle from "@material-ui/core/DialogTitle";
import CircularProgress from "@material-ui/core/CircularProgress";
import LibraryMusicIcon from "@material-ui/icons/LibraryMusic";

import { GET_TRACKS_QUERY } from '../../pages/App';
import { UserContext } from '../../Root';
import Error from '../Shared/Error';

const UpdateTrack = ({ classes, track }) => {
  const currentUser = useContext(UserContext);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(track.title);
  const [hashtag, setHashtag] = useState(track.hashtag);
  const [description, setDescription] = useState(track.description);
  const [file, setFile] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fileError, setFileError] = useState("");
  const isCurrentUser = currentUser.id === track.postedBy.id


  const handleAudioChange = event => {
    const selectedFile = event.target.files[0]
    const fileSizeLimit = 15000000;
    if (selectedFile && selectedFile.size > fileSizeLimit) {
      setFileError(`${selectedFile.name}: アップロードできるファイルサイズは15MBが上限です。`)
    } else {
      setFile(selectedFile);
      setFileError('');
    }
  }

  const handleAudioUpload = async () => {
    try {
      const data = new FormData();
      data.append('file', file);
      data.append('resource_type', 'raw');
      data.append('upload_preset', 'trackgram');
      data.append('cloud_name', 'tatjapan');
      const res = await axios.post("https://api.cloudinary.com/v1_1/tatjapan/raw/upload", data);
      return res.data.url;
    } catch (err) {
      console.error('ファイルアップロード中にエラーが発生しました。', err);
      setSubmitting(false);
    }

  };

  const handleSubmit = async (event, updateTrack) => {
    event.preventDefault();
    setSubmitting(true);
    // ファイルをアップロードしてCloudinaryのAPIからURL取得
    const uploadedUrl = await handleAudioUpload();
    updateTrack({ variables: { trackId: track.id, title, hashtag, description, url: uploadedUrl } });
  };

  return isCurrentUser && (
    <>
   
      {/* update track button */}
     <IconButton onClick={() => setOpen(true)}>
       <EditIcon />
     </IconButton>

      {/* update track DIALOG */}
      <Mutation
        mutation={UPDATE_TRACK_MUTATION}
        onCompleted={data => {
          console.log({ data })
          setSubmitting(false)
          setOpen(false)
          setTitle("")
          setDescription("")
          setHashtag("")
          setFile("")
        }}
        /* refetchQueries={() => [{ query: GET_TRACKS_QUERY }]} */
      >
        {(updateTrack, { loading, error }) => {
          if (error) return <Error error={error} />;

          return (
            <Dialog open={open} className={classes.dialog}>
              <form onSubmit={event => handleSubmit(event, updateTrack)}>
                <DialogTitle>Update Track</DialogTitle>
                <DialogContent>
                  <DialogContentText>
                    音楽ファイルにタイトルと説明、ハッシュタグを追加
                  </DialogContentText>
                  <FormControl fullWidth>
                    <TextField
                      label="タイトル"
                      placeholder="タイトルを追加"
                      onChange={event => setTitle(event.target.value)}
                      value={title}
                      className={classes.textField}
                    />
                  </FormControl>

                  <FormControl fullWidth>
                    <TextField
                      multiline
                      rows="3"
                      label="説明"
                      placeholder="説明を追加"
                      onChange={event => setDescription(event.target.value)}
                      value={description}
                      className={classes.textField}
                    />
                  </FormControl>

                  <FormControl fullWidth>
                    <TextField
                      multiline
                      rows="3"
                      label="ハッシュタグ"
                      placeholder="ハッシュタグを追加（e.g. #music）"
                      onChange={event => setHashtag(event.target.value)}
                      value={hashtag}
                      className={classes.textField}
                    />
                  </FormControl>

                  <FormControl error={Boolean(fileError)}>
                    <input
                      id="audio"
                      required
                      type="file"
                      accept="audio"
                      className={classes.input}
                      onChange={handleAudioChange}
                    />
                    <label htmlFor="audio">
                      <Button variant="outlined" color={file ? "secondary" : "inherit"}
                        component="span" className={classes.button}
                      >
                        音楽ファイル(最大15MBまで)
                        <LibraryMusicIcon className={classes.icon} />
                      </Button>
                      {file && file.name}
                      <FormHelperText>{fileError}</FormHelperText>
                    </label>
                  </FormControl>
                </DialogContent>
                <DialogActions>
                  <Button
                    disabled={submitting}
                    onClick={() => setOpen(false)}
                    className={classes.cancel}
                  >
                    キャンセル
                  </Button>
                  <Button
                    disabled={
                      submitting || !title.trim() || !description.trim() || !file
                    }
                    type="submit"
                    className={classes.save}
                  >
                    {submitting ? (
                      <CircularProgress className={classes.save} size={24} />
                    ) : ("トラックをアップデート")}
                  </Button>
                </DialogActions>
              </form>
            </Dialog>
          )
        }}
      </Mutation>

    </>
  );
};

const UPDATE_TRACK_MUTATION = gql`
  mutation($trackId: Int!, $title: String, 
           $description: String, $hashtag: String, 
           $url: String) {
             updateTrack (
               trackId: $trackId,
               title: $title,
               description: $description,
               hashtag: $hashtag,
               url: $url
             ) {
               track {
                id
                title
                description
                hashtag
                url
                likes {
                  id
                }
                postedBy {
                  id
                  username
                }
              }
             }
           }

`;

const styles = theme => ({
  container: {
    display: "flex",
    flexWrap: "wrap"
  },
  dialog: {
    margin: "0 auto",
    maxWidth: 550
  },
  textField: {
    margin: theme.spacing.unit
  },
  cancel: {
    color: "red"
  },
  save: {
    color: "green"
  },
  button: {
    margin: theme.spacing.unit * 2
  },
  icon: {
    marginLeft: theme.spacing.unit
  },
  input: {
    display: "none"
  }
});

export default withStyles(styles)(UpdateTrack);
