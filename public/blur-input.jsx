/** @jsx React.DOM */

var TAB = 9;

/* You know when you want to propagate input to a parent...
 * but then that parent does something with the input...
 * then changing the props of the input...
 * on every keystroke...
 * so if some input is invalid or incomplete...
 * the input gets reset or otherwise effed...
 *
 * This is the solution.
 *
 * Enough melodrama. Its an input that only sends changes
 * to its parent on blur.
 */
var BlurInput = React.createClass({
    componentDidMount: function() {
        this.getDOMNode().selectionStart = this.props.value.length;
    },

    propTypes: {
        value: React.PropTypes.string.isRequired,
        onChange: React.PropTypes.func.isRequired
    },
    getInitialState: function() {
        return { value: this.props.value };
    },
    render: function() {
        return this.transferPropsTo(<textarea
            value={this.state.value}
            onChange={this.handleChange}
            onKeyDown={this.handleKeydown}
            onBlur={this.handleBlur} />);
    },
    handleKeydown: function(e) {
        if (e.keyCode === TAB) {
            e.preventDefault();
            if (e.shiftKey) {
                this.props.onPrev(this.state.value);
            } else {
                this.props.onNext(this.state.value);
            }
        }
    },
    componentWillReceiveProps: function(nextProps) {
        this.setState({ value: nextProps.value });
    },
    handleChange: function(e) {
        var currentValue = this.state.value;
        var newValue = e.target.value;

        if (newValue === "\n") {
            // noop
        } else if (newValue[newValue.length - 1] === "\n") {
            if (!currentValue.match(/\* .*$/)) {
                this.props.onNext(currentValue.trim());
            } else {
                this.setState({ value: e.target.value });
            }
        } else {
            this.setState({ value: e.target.value });
        }
    },
    handleBlur: function(e) {
        this.props.onChange(e.target.value);
    }
});

module.exports = BlurInput;
