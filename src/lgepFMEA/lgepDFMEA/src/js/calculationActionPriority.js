const HIGH = 'H';
const MIDDLE = 'M';
const LOW = 'L';

export const calculateAp = (severity, occurence, detection) => {
  severity = parseInt(severity);
  occurence = parseInt(occurence);
  detection = parseFloat(detection);
  switch (severity) {
    case 1:
      return LOW;
    case 9:
    case 10:
      return _calBySeverityTopHigh(occurence, detection);
    case 7:
    case 8:
      return _calBySeverityMiddleHigh(occurence, detection);
    case 4:
    case 5:
    case 6:
      return _calBySeverityMiddle(occurence, detection);
    default:
      return _calBySeverityLow(occurence, detection);
  }
};

const _calBySeverityTopHigh = (occurence, detection) => {
  if (occurence === 1) {
    return LOW;
  } else if (occurence === 4 || occurence === 5) {
    if (detection === 1) {
      return MIDDLE;
    }
  } else if (occurence <= 3) {
    if (detection >= 7) {
      return HIGH;
    } else if (detection >= 5) {
      return MIDDLE;
    }
    return LOW;
  }
  return HIGH;
};

const _calBySeverityMiddleHigh = (occurence, detection) => {
  if (occurence === 1) {
    return LOW;
  } else if (occurence >= 8) {
    return HIGH;
  } else if (occurence === 6 || occurence === 7) {
    if (detection === 1) {
      return MIDDLE;
    }
    return HIGH;
  } else if (occurence === 4 || occurence === 5) {
    if (detection >= 7) {
      return HIGH;
    }
    return MIDDLE;
  } else {
    if (detection >= 5) {
      return MIDDLE;
    }
    return LOW;
  }
};

const _calBySeverityMiddle = (occurence, detection) => {
  if (occurence <= 3) {
    return LOW;
  } else if (occurence === 4 || occurence === 5) {
    if (detection >= 7) {
      return MIDDLE;
    }
    return LOW;
  } else if (occurence === 6 || occurence === 7) {
    if (detection === 1) {
      return LOW;
    }
    return MIDDLE;
  } else {
    if (detection >= 5) {
      return HIGH;
    }
    return MIDDLE;
  }
};

const _calBySeverityLow = (occurence, detection) => {
  if (occurence >= 8) {
    if (detection >= 5) {
      return MIDDLE;
    }
  }
  return LOW;
};
