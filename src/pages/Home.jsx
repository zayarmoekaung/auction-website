import PropTypes from 'prop-types';
import Grid from "../components/Grid";
import { ItemModal } from "../components/Modal";

function HomePage({ active }) {
  return (
    <div className="container mt-3">
      {!active && (
        <div className="alert alert-warning" role="alert">
          Account is not activated, please contact Panther 9 to activate your account.
        </div>
      )}
      {active && <Grid />}
      <ItemModal />
    </div>
  );
}

HomePage.propTypes = {
  active: PropTypes.bool
}

export default HomePage;
