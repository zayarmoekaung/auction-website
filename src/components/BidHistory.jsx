import React from 'react';
import { formatDate } from "../utils/formatString";

const BidHistory = ({ history }) => {
  return (
    <div className="mt-3">
      <h5>Bid History</h5>
      <ul className="list-group">
        {history.map((bid, index) => (
          <li key={index} className="list-group-item">
            <strong>{bid.username}</strong> bid {bid.amount} on {formatDate(bid.timestamp.toDate())}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BidHistory;
