import React, { Component } from 'react'
import './Save.css'
import copy from 'copy-to-clipboard'
import Navbar from '../components/Navbar'
import Profile from '../components/Profile'
import Waiting from '../components/Waiting'


class Save extends Component {

  constructor(props) {
    super(props)
    const hydrate = (field) => this.props[field] || ''
    this.state = {
      name: this.props.name,
      saving: false,
      author: hydrate('author'),
      organism: hydrate('organism'),
      disease: hydrate('disease'),
      tissue: hydrate('tissue'),
      rightsHolder: hydrate('rightsHolder'),
      rights: hydrate('rights'),
      reference: hydrate('reference'),
      description: hydrate('description'),
      uuid: hydrate('uuid'),
      public: false,
      overwrite: false,
      success: false,
    }
    if (this.props.createdFromSingleton) {
      alert("This network does not exist on NDEx as a collection, it cannot be overwritten \n(otherwise your NDEx network will not be readable/writeable to anyone \nbut Cytoscape). Instead, it will be saved as a new network.")
    }
  }

  componentDidMount() {
    document.title = "Save to NDEx";
  }

  closeWindow() {
  	window.frame.setVisible(false);
	}

  onSave() {
    const {
      serverAddress,
      userName,
      password,
    } = this.props.selectedProfile
    let newuuid = ''
    let method = 'POST'
    if (this.state.overwrite) {
      newuuid = this.props.uuid
      method = 'PUT'
    }
    const metadata = {
      name: this.state.name,
      author: this.state.author,
      organism: this.state.organism,
      disease: this.state.disease,
      tissue: this.state.tissue,
      rightsHolder: this.state.rightsHolder,
      rights: this.state.rights,
      reference: this.state.reference,
      description: this.state.description,
    }
    const payload = JSON.stringify({
        userId: userName,
        password: password,
        serverUrl: serverAddress + '/v2',
        uuid: newuuid,
        metadata: metadata,
        isPublic: this.state.public,
     })

    if (userName === undefined || userName === "") {
      alert("You must be logged with your NDEx username to save a network.")
      return
    }
    this.setState({ saving: true })
    fetch('http://localhost:' + (window.restPort || '1234') + '/cyndex2/v1/networks/current', {
      method: method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: payload
    })
      .then((blob) => blob.json())
      .then((resp) => {
        if ((resp.errors.length) !== 0) {
          alert("Error saving: " + JSON.stringify(resp).errors[0].message || "Unknown")
          this.setState({saving: false})
        } else {
          this.saveImage(resp.data.suid, resp.data.uuid)
        }
      })
      .catch((error) => {
        alert("There's something wrong with your connection and we could not save your network to NDEx.")
        this.setState({saving: false})
      })
  }

  saveImage(networkId, uuid) {
    fetch('http://localhost:' + (window.restPort || '1234') + '/v1/networks/' + networkId + '/views/first.png')
    .then((png) => png.blob())
    .then((blob) => {
      fetch('http://v1.image-uploader.cytoscape.io/' + uuid, {
        method: 'POST',
        headers: {
          'Content-Type': 'image/png',
        },
        body: blob
        })
        .then((resp) => {
          if (!resp.ok){
            throw new Error(resp.statusText)
          }
          this.setState({saving: false, 'uuid':uuid, 'success': true})
      }).catch((error) => {
        alert("Your network was saved, but an image could not be generated... the old image will be used instead.")
        this.setState({saving: false, 'uuid':uuid, 'success': true})
      });
    }).catch((error) => {
      alert("Your network was saved, but an image could not be generated... the old image will be used instead.")
      this.setState({saving: false, 'uuid':uuid, 'success': true})
    })
  }

  handleChangeName(e) {
    this.setState({ name: e.target.value })
  }

  handleChangeOverwrite(e) {
    this.setState({ overwrite: !this.state.overwrite })
  }

  handleChangeVisibility(e) {
    this.setState({ public: !this.state.public })
  }

  handleFieldChange(field) {
    return (e) => {
      let newState = {
        [field]: e.target.value
      }
      this.setState(newState)
    }
  }

  render() {
    const {
      profiles,
      selectedProfile,
      handleProfileAdd,
      handleProfileSelect,
      handleProfileDelete,
      handleProfileLogout
    } = this.props
    console.log("Saving")
    console.log(this.props)
    return (
      <div className="Save">
        {this.state.saving ? <Waiting text={"Saving network " + this.props.name + " to NDEx..."}/> : null}
        {this.state.success &&
          <div className="success-modal">
            <p id="success-modal-message" onClick={() => {
              copy(this.state.uuid);
              alert("UUID Copied")
              this.closeWindow()}
            }>Network saved with UUID {this.state.uuid}. Click to copy.</p>
            <p id="success-modal-close" onClick={() => this.closeWindow()}>Click to close this window.</p>
          </div>
        }
        <Navbar>
          <Profile
            profiles={profiles}
            selectedProfile={selectedProfile}
            onProfileAdd={handleProfileAdd}
            onProfileSelect={handleProfileSelect}
            onProfileDelete={handleProfileDelete}
            onProfileLogout={handleProfileLogout}
          />
        </Navbar>
        <div className="Save-entryfields">
          <div className="Save-left">
            <LabelField
              value={this.state.author}
              onChange={this.handleFieldChange('author')}
              label="Author"
            />
            <LabelField
              value={this.state.organism}
              onChange={this.handleFieldChange('organism')}
              label="Organism"
            />
            <LabelField
              value={this.state.disease}
              onChange={this.handleFieldChange('disease')}
              label="Disease"
            />
            <LabelField
              value={this.state.tissue}
              onChange={this.handleFieldChange('tissue')}
              label="Tissue"
            />
            <LabelField
              value={this.state.rightsHolder}
              onChange={this.handleFieldChange('rightsHolder')}
              label="Rights Holder"
            />
            <LabelField
               value={this.state.rights}
               onChange={this.handleFieldChange('rights')}
               label="Rights"
             />
            <TextareaField
              value={this.state.reference}
              onChange={this.handleFieldChange('reference')}
              label="Reference"
            />
          </div>
          <div className="Save-right">
            <TextareaField
              value={this.state.description}
              onChange={this.handleFieldChange('description')}
              label="Description"
            />
            <div className="Save-visibility">
              <h3>Save as Public?</h3>
              <input
                 type="checkbox"
                 value={this.state.public}
                 onChange={(e) => this.handleChangeVisibility(e)}
              />
            </div>
            <div className="Save-visibility">
              <h3>Save as a New Network?</h3>
              {this.state.uuid !== "" ?
              <input
                 type="checkbox"
                 value={!this.state.overwrite}
                 defaultChecked={!this.state.overwrite}
                 onChange={(e) => this.handleChangeOverwrite(e)}
              /> :
              <input type="checkbox" defaultChecked={true} disabled/>}
            </div>

          </div>
        </div>
        <div className="Save-actionbar">
          <h5 className="Save-actionbar-label">
            Network Name:
          </h5>
          <input
             type="text"
             placeholder="Network name..."
             value={this.state.name}
             onChange={(e) => this.handleChangeName(e)}
          />
          <button onClick={this.closeWindow}>
            Cancel
          </button>
          <button onClick={() => this.onSave()}>
           Save
          </button>
        </div>
      </div>
    )
  }

}

const LabelField = ({label, value, onChange}) => (
  <div className="Save-labelfield">
    <label>{label.toUpperCase()}</label>
    <input type="text" value={value} onChange={onChange} placeholder={label + "..."}/>
  </div>
)

const TextareaField = ({label, value, onChange}) => (
  <div className="Save-textareafield">
    <label>{label.toUpperCase()}</label>
    <textarea value={value} onChange={onChange} placeholder={"Enter your " + label.toLowerCase() + " here..."}/>
  </div>
)

export default Save
