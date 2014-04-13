/** @jsx React.DOM */

var _ = require('underscore');

var BlurInput = require("./blur-input.jsx");

function setSelectionRange(input, selectionStart, selectionEnd) {
    if (input.setSelectionRange) {
        input.focus();
        input.setSelectionRange(selectionStart, selectionEnd);
    }
    else if (input.createTextRange) {
        var range = input.createTextRange();
        range.collapse(true);
        range.moveEnd('character', selectionEnd);
        range.moveStart('character', selectionStart);
        range.select();
    }
}

function setCaretToPos (input, pos) {
    setSelectionRange(input, pos, pos);
}


var Editor = React.createClass({
    getInitialState: function() {
        return {
            values: currentNote || [],
            showingSpritz: false,
            myId: null,
            lastSaved: null,
            saving: false
        }
    },

    render: function() {
        return <div>
            {!this.state.showingSpritz && <div 
                className="cram-button"
                onClick={() => {
                    var self = this;
                    this.setState({
                        showingSpritz: true
                    });
                    $("#spritz").slideDown();
                    $.get("/entries/new?content=" + JSON.stringify(this.state.values), function(result) {
                        var json = JSON.parse(result);
                        self.setState({
                            myId: json.id
                        });
                        SpritzClient.fetchContents("http://107.170.192.223/entries/" + json.id, function (spritzText) {
                            $(".spritzer").data("controller").startSpritzing(spritzText);
                        }, function() {});
                    });
                }}>
                <i className="fa fa-chevron-down" />
            </div>}
            {this.state.showingSpritz && <div 
                className="cram-button"
                onClick={() => {
                    $("#spritz").slideUp();
                    this.setState({
                        showingSpritz: false
                    });
            }}>
                <i className="fa fa-chevron-up" />
            </div>}
            <div className="document">
                {_.map(this.state.values, (value, i) =>
                       <Paragraph
                           value={value}
                           ref={"paragraph"+i}
                           key={i}
                           onChange={this.changeValue(i)} 
                           handleChangeFocus={this.handleChangeFocus(i)}
                           onBackspace={this.backspace(i)}
                           onAdd={this.add(i)} />
                       )}
                <div className="add-wrapper">
                   <div
                       className="add"
                       onClick={this.addNew}>+</div>
                </div>
                <div className="add"
                    onClick={this.handleSave}>Save</div>
            {this.state.saving &&
                <div>Saving...</div>}
            {this.state.lastSaved &&
                <div className="share">Share this note with friends at http://swagnotes.net/{this.state.lastSaved}</div>}
           </div>
        </div>;
    },

    handleChangeFocus: function(i) {
        return (value) => {
            var newValues = this.state.values;
            newValues = _.filter(this.state.values, (value, j) => i === j || value !== "");
            this.setState({
                values: newValues
            }, () => {
                if (this.state.values[i] !== value && newValues.length === this.state.values.length) {
                    this.refs["paragraph"+(Math.max(0,i-1))].getDOMNode().focus();
                }
            });
        }
    },

    handleSave: function() { 
        var self = this;
        this.setState({
            saving: true
        });
        $.get("/entries/new?content=" + JSON.stringify(this.state.values), function(result) {
            var json = JSON.parse(result);
            self.setState({
                lastSaved: json.id,
                saving: false
            });
        });
    },
    addNew: function() {
        this.setState({
            values: this.state.values.concat([""])
        }, () => {
            this.refs["paragraph"+(this.state.values.length - 1)].getDOMNode().focus();
        });
    },
    changeValue: function(i) {
        return (value, cb) => {
            var newValues = _.clone(this.state.values);
            newValues[i] = value;
            if (newValues[i] === "") {
                newValues.splice(i, 1);
            }
            this.setState({
                values: newValues // _.filter(newValues, (value) => value !== "")
            }, () => {
                if (cb) {
                    cb();
                }
            });
        };
    },
    add: function(i) {
        return (value) => {
            var newValues = _.filter(this.state.values, (value, j) => i === j ||  value !== "");
            newValues = newValues.slice(0,i + 1)
                .concat([value])
                .concat(newValues.slice(i + 1,newValues.length));
            this.setState({
                values: newValues
            }, () => {
                this.refs["paragraph"+(i + 1)].getDOMNode().focus();
            });

        };
    },
    backspace: function(i) {
        return () => {
            if (i === 0) return;
            var newValues = _.clone(this.state.values);
            var oldVal = newValues[i];
            newValues.splice(i,1);
            var previous = newValues[i-1];
            newValues[i-1] += oldVal;
            this.setState({
                values: newValues
            }, () => {
                var node = this.refs["paragraph"+(i - 1)].getDOMNode();
                node.focus();
                var sel = window.getSelection();
                sel.collapse(node.firstChild, 3);
            });
        }
    }
});

var Paragraph = React.createClass({
    open: function() {
        this.setState({
            editing: true
        }, () => {
            var node = this.refs.editor.getDOMNode()
            node.focus();
            node.selectionStart = node.value.length;
        });
    },

    getInitialState: function() {
        return {
            editing: false
        };
    },

    getDefaultProps: function() {
        return {
            value: "test"
        };
    },

    render: function() {
        return <div className="paragraph"
                        contentEditable="true"
                        onFocus={this.handleFocus}
                        onBlur={this.handleBlur}
                        onKeyUp={this.handleChange}
                        onKeyDown={this.handleKeydown} >
                {!this.state.editing && markedReact(this.props.value)}
                {this.state.editing && this.props.value !== "" && this.props.value}
        </div>;
    },

    handleChange: function(e) {
        this.setState({value: e.target.innerHTML });
    },

    handleBlur: function() {
       
        this.props.onChange(this.state.value, () => {
            this.setState({
                editing: false
            });
        });
    },

    handleFocus: function() { 
        this.setState({
            editing: true,
            startingValue: this.getDOMNode().innerHTML
        }, () => {
            this.props.handleChangeFocus(this.props.value);
        });
    },

    handleKeydown: function(e) { 
        var offset = window.getSelection().extentOffset;
        if (e.keyCode === 13 /* enter */) {
            if (offset > 0) {
                var value = this.state.value;
                this.getDOMNode().innerHTML = this.state.startingValue;
                this.props.onChange(value.substring(0, offset), () => {
                    this.setState({value: value.substring(0, offset)}, () => {
                        this.props.onAdd(value.substring(offset, value.length));
                    });
                });
            }
            e.preventDefault();
        } else if (e.keyCode == 8) {
            var offset = window.getSelection().extentOffset;
            if (offset === 0) {
                this.props.onChange(this.state.value, () => {
                    this.props.onBackspace();
                });
                e.preventDefault();
            }
        }
    }
});

React.renderComponent(<Editor />, document.getElementById("app"));
