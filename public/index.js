/** @jsx React.DOM */

var _ = require('underscore');

var BlurInput = require("./blur-input.jsx");

var Editor = React.createClass({
    getInitialState: function() {
        return {
            values: currentNote || [],
            showingSpritz: false,
            myId: null
        }
    },

    render: function() {
        return <div>
            <div 
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
                CRAM
            </div>
            <div 
                className="cram-button"
                onClick={function() {
                    $("#spritz").slideUp();
            }}>
                HIDE
            </div>
            {this.state.myId &&
                <span>Share this note with friends at SOME_URL/{this.state.myId}</span>
            }
            <div className="document">
                {_.map(this.state.values, (value, i) =>
                   <Paragraph
                       value={value}
                       ref={"paragraph"+i}
                       key={i}
                       onChange={this.changeValue(i)} 
                       onNext={this.next(i)} />)}
                <div className="add-wrapper">
                   <div
                       className="add"
                       onClick={this.addNew}>+</div>
                </div>
           </div>
        </div>;
    },
    addNew: function() {
        this.setState({
            values: this.state.values.concat([""])
        }, () => {
            this.refs["paragraph"+(this.state.values.length - 1)].open();
        });
    },
    changeValue: function(i) {
        return (value) => {
            var newValues = _.clone(this.state.values);
            newValues[i] = value;
            if (newValues[i] === "") {
                newValues.splice(i, 1);
            }
            this.setState({
                values: newValues // _.filter(newValues, (value) => value !== "")
            });
        };
    },
    next: function(i) {
        return (value) => {
            var newValues = _.clone(this.state.values);
            newValues[i] = value;
            newValues = _.filter(newValues, (value) => value !== "");
            if (i + 1 < this.state.values.length) {
                this.setState({
                    values: newValues
                }, () => {
                    this.refs["paragraph"+(i + 1)].open();
                });
            } else {
                this.setState({
                    values: newValues.concat([""])
                }, () => {
                    this.refs["paragraph"+(this.state.values.length-1)].open();
                });
            }
        };
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
        if (this.state.editing) {
            return <BlurInput
                className="paragraph"
                ref="editor"
                type="text"
                value={this.props.value}
                onNext={(value) => {
                    this.setState({
                        editing: false
                    });
                    this.props.onNext(value);
                }}
                onChange={(e) => {
                    this.setState({
                        editing: false
                    });
                    this.props.onChange(e);
                }} />
        } else {
            return <div
                className="paragraph"
                onClick={this.startEditor} >
                {markedReact(this.props.value)}
            </div>;
        }
    },

    startEditor: function() {
        this.setState({
            editing: true
        }, function() {
            this.refs.editor.getDOMNode().focus();
        });
    }
});

React.renderComponent(<Editor />, document.getElementById("app"));