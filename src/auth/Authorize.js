import _ from 'lodash';
import { connect } from 'react-redux';
import React, { PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { getAppDetails } from './authAction';
import { accountUpdate, clearUpdatingResult } from '../actions';
import PasswordDialog from './../widgets/PasswordDialog';

class Authorize extends React.Component {
  constructor(props) {
    super(props);
    this.permissions = {};
    this.state = { error: {}, showPasswordDialog: false };
  }

  componentWillMount() {
    const { user = {} } = this.props.auth;
    const { redirect_url } = this.props.location.query;
    const appName = this.props.params.app;
    const jsonMetadata = typeof user.json_metadata !== 'object' ? {} : user.json_metadata;

    jsonMetadata.apps = jsonMetadata.apps || {};
    if (jsonMetadata.apps[appName] && jsonMetadata.apps[appName].permissions) {
      window.location = `/auth/authorize?&redirect_url=${redirect_url}&appUserName=${appName}`;
    } else {
      this.props.getAppDetails(appName, redirect_url);
    }
  }

  closePasswordDialog = () => {
    this.setState({ showPasswordDialog: false, passwordCallback: undefined });
    this.props.clearUpdatingResult();
  };

  savePassword = (passwordOrWif) => {
    this.state.passwordCallback(passwordOrWif);
  };

  authorizeUser = (redirect_url, appName) => {
    const { user = {} } = this.props.auth;
    this.setState({
      showPasswordDialog: true,
      passwordCallback: (passwordOrWif) => {
        const permissions = _.chain(this.permissions).map((v1, k1) =>
          v1.checked && k1).filter().value();
        const jsonMetadata = typeof user.json_metadata !== 'object' ? {} : user.json_metadata;
        jsonMetadata.apps = jsonMetadata.apps || {};
        jsonMetadata.apps[appName] = Object.assign((jsonMetadata.apps[appName] || {}), {
          permissions,
        });
        this.props.accountUpdate(user.name, passwordOrWif, user.memo_key, jsonMetadata)
          .then(() => {
            window.location = `/auth/authorize?&redirect_url=${redirect_url}&appUserName=${appName}`;
          });
      },
    });
  }

  render() {
    const appName = this.props.params.app;
    const { apps = {}, user = {} } = this.props.auth;
    const appDetails = apps[appName] || {};
    const { permissions: permissionList = [], redirect_url, error } = appDetails;

    return (
      <div className="block">
        <div className="mbl"><img alt="app-logo" src={`https://img.busy6.com/@${appName}`} width="70" /></div>
        {(error) ?
          <div>{error}</div> :
          (<div>
            <p>The app <b>{appName}</b> is requesting permission to do the following: </p>
            <ul className="mbm">
              {permissionList.map(({ name, api }) => <div key={api}>
                <input type="checkbox" className="form-check-input" ref={c => (this.permissions[api] = c)} defaultChecked="true" value={api} />
                {name}
              </div>)}
            </ul>
            <a onClick={() => this.authorizeUser(redirect_url, appName)} className="btn btn-primary mbm">Continue as @{user.name}</a>
          </div>)
        }
        {this.state.showPasswordDialog && <PasswordDialog
          isUpdating={false}
          error={undefined}
          onClose={this.closePasswordDialog}
          onSave={this.savePassword}
        />}
      </div>
    );
  }
}

Authorize.propTypes = {
  params: PropTypes.shape({ app: PropTypes.string.isRequired }),
  location: PropTypes.shape({ query: PropTypes.object.isRequired }),
  auth: PropTypes.shape({ user: PropTypes.object.isRequired, apps: PropTypes.object }),
  getAppDetails: PropTypes.func,
  accountUpdate: PropTypes.func,
  clearUpdatingResult: PropTypes.func,
};

const mapStateToProps = state => ({ auth: state.auth });

const mapDispatchToProps = dispatch => ({
  getAppDetails: bindActionCreators(getAppDetails, dispatch),
  accountUpdate: bindActionCreators(accountUpdate, dispatch),
  clearUpdatingResult: bindActionCreators(clearUpdatingResult, dispatch),
});

module.exports = connect(mapStateToProps, mapDispatchToProps)(Authorize);
