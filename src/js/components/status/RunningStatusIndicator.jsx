// @flow

import React, {Component, PropTypes} from 'react';
import moment from 'moment';
import { StatusIndicator, decodeResultValue } from './StatusIndicator';

const {number, string} = PropTypes;

// TODO: avoid duplicating flow constants from StatusIndicator
const validResultValues = {
    success: 'success',
    failure: 'failure',
    running: 'running',
    queued: 'queued',
    unstable: 'unstable',
    aborted: 'aborted',
    not_built: 'not_built',
    unknown: 'unknown'
};

// Enum type from const validResultValues
export type Result = $Keys<typeof validResultValues>;

/**
 * RunningStatusIndicator is a wrapper around StatusIndicator that allows
 * for an in-progress status to self update.
 *
 * Properties:
 * "estimatedDuration": time in millis over which the progress indicator will update.
 * "startTime": epoch millis indicating when tracking of progress begins from.
 */
export class RunningStatusIndicator extends Component {

    static validResultValues:typeof validResultValues;

    constructor(props) {
        super(props);

        this.state = {
            percentage: 0,
        };

        this.startTimeMillis = - 1;
        this.clearIntervalId = -1;
    }

    componentDidMount() {
        this._initializeProgress(this.props);
    }

    componentWillReceiveProps(nextProps) {
        this._initializeProgress(nextProps);
    }

    _initializeProgress(props) {
        // ensure we don't leak setInterval by proactively clearing it
        // the code will restart the interval if the state dictates it
        this._stopProgressUpdates();

        if (!props) {
            return;
        }

        const cleanResult = decodeResultValue(props.result);
        const isRunning = cleanResult === validResultValues.running;

        if (isRunning) {
            this.startTimeMillis = this.props.startTime || moment().valueOf();

            // TODO: implement a clever algorithm to determine update frequency
            // we probably just need to divide duration by some fixed constant
            // equal to the max number of updates we want to draw
            this.clearIntervalId = setInterval(() => {
                this._updateProgress();
            }, 1000);

            this._updateProgress();
        }
    }

    _updateProgress() {
        const nowMillis = moment().valueOf();
        const percentage = (nowMillis - this.startTimeMillis) / this.props.estimatedDuration * 100;
        this.setState({
            percentage
        });

        if (percentage >= 100) {
            this._stopProgressUpdates();
        }
    }

    _stopProgressUpdates() {
        clearInterval(this.clearIntervalId);
        this.clearIntervalId = -1;
    }

    componentWillUnmount() {
        this._stopProgressUpdates();
    }

    render() {
        return (
            <StatusIndicator { ... this.props } percentage={this.state.percentage} />
        );
    }
}

RunningStatusIndicator.propTypes = {
    result: string,
    percentage: number,
    width: string,
    height: string,
    startTime: number,
    estimatedDuration: number,
};

RunningStatusIndicator.validResultValues = validResultValues;