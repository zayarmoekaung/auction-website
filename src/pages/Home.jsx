import PropTypes from 'prop-types';
import Grid from "../components/Grid";
import { ItemModal } from "../components/Modal";

function HomePage({ active }) {
  return (
    <div className="container mt-3">
      <Grid />
      <ItemModal active={active}/>
    </div>
  );
}

HomePage.propTypes = {
  active: PropTypes.bool
}

export default HomePage;
