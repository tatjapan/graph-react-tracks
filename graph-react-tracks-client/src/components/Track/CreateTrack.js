import React, { useState } from "react";
import { Mutation } from 'react-apollo';
import { gql } from 'apollo-boost';
import axios from 'axios';
import withStyles from "@material-ui/core/styles/withStyles";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import FormControl from "@material-ui/core/FormControl";
import FormHelperText from "@material-ui/core/FormHelperText";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import AddIcon from "@material-ui/icons/Add";
import ClearIcon from "@material-ui/icons/Clear";
import LibraryMusicIcon from "@material-ui/icons/LibraryMusic";

import { GET_TRACKS_QUERY } from '../../pages/App';
import Error from '../Shared/Error';


const CreateTrack = ({ classes }) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [hashtag, setHashtag] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fileError, setFileError] = useState("");

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

  const handleUpdateCache = (cache, { data: { createTrack }}) => {
    const data = cache.readQuery({ query: GET_TRACKS_QUERY })
    const tracks = data.tracks.concat(createTrack.track)
    cache.writeQuery({ query: GET_TRACKS_QUERY, data: { tracks } })
  }

  const handleSubmit = async (event, createTrack) => {
    event.preventDefault();
    setSubmitting(true);
    // ファイルをアップロードしてCloudinaryのAPIからURL取得
    const uploadedUrl = await handleAudioUpload();
    createTrack({ variables: { title, hashtag, description, url: uploadedUrl }});
  };

  return (
    <>
    {/* create track button */}
    <Button onClick={() => setOpen(true)} variant="fab" className={classes.fab} color="secondary">
      {open ? <ClearIcon /> : <AddIcon />}
    </Button>

    {/* create track DIALOG */}
    <Mutation 
      mutation={CREATE_TRACK_MUTATION}
      onCompleted={data => {
        console.log({data})
        setSubmitting(false)
        setOpen(false)
        setTitle("")
        setDescription("")
        setHashtag("")
        setFile("")
      }}
      update={handleUpdateCache}
      /* refetchQueries={() => [{ query: GET_TRACKS_QUERY }]} */
    >
      {(createTrack, { loading, error }) => {
        if (error) return <Error error={error} />;

        return (
            <Dialog open={open} className={classes.dialog}>
              <form onSubmit={event => handleSubmit(event, createTrack)}>
                <DialogTitle>Create Track</DialogTitle>
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
                    ) : ( "トラックを追加" )}
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

const CREATE_TRACK_MUTATION = gql`
  mutation ($title: String!, $description: String!, $hashtag: String!, $url: String!) {
    createTrack(title: $title, description: $description, hashtag: $hashtag, url: $url) 
    {
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
  },
  fab: {
    position: "fixed",
    bottom: theme.spacing.unit * 2,
    right: theme.spacing.unit * 2,
    zIndex: "200"
  }
});

export default withStyles(styles)(CreateTrack);
